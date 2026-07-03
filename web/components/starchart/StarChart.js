"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORLD, computeLayout, computeDust, hashString } from './layout';
import Constellation from './Constellation';
import ConstellationIndex from './ConstellationIndex';
import NotePanel from './NotePanel';
import styles from '../../styles/MapOfMe.module.css';

// k = screen pixels per world unit
const MAX_K = 1.75;
// Don't zoom in past this when focusing a constellation — keeps small
// two-star groups from filling the screen.
const FOCUS_MAX_K = 1.1;
const FOCUS_PADDING = 140;
const DRAG_THRESHOLD = 5;
const TWEEN_MS = 650;
// How far (world units) the camera may pan past the world bounds — soft
// edges instead of hard walls.
const OVERSCROLL = 260;
// Padding around the constellation cluster for the overview framing.
const OVERVIEW_PADDING = 220;
// Minimum zoom the camera glides to when a star is selected.
const SELECT_MIN_K = 0.75;
// Desktop note panel occupies the right edge; offset the camera centre so
// the selected star sits centred in the remaining space.
const PANEL_CLEARANCE = 360;
const MOBILE_BREAKPOINT = 767;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Dust depth planes, back to front: higher factor = trails the camera more
// = reads as further away. The constellations sit alone in the 1.0 plane.
const DUST_LAYERS = [
    { name: 'deep', factor: 0.8 },
    { name: 'mid', factor: 0.6 },
    { name: 'close', factor: 0.35 },
];

const renderDust = (d) => (
    <circle
        key={d.id}
        className={`${styles.dust} ${d.twinkle ? styles.twinkle : ''}`}
        cx={d.x}
        cy={d.y}
        r={d.r}
        opacity={d.opacity}
        style={{
            '--o': d.opacity,
            '--twinkle-duration': `${d.duration}s`,
            '--twinkle-delay': `${d.delay}s`,
        }}
    />
);

// The sky is rendered as one full-viewport SVG whose viewBox is the visible
// world rect. Panning/zooming rewrites the viewBox attribute imperatively —
// no React re-renders, and everything stays vector-crisp at any zoom (a CSS
// transform on a big rasterised layer is what made the first prototype look
// low-res).
const StarChart = ({ items }) => {
    const viewportRef = useRef(null);
    const svgRef = useRef(null);
    const dustLayerRefs = useRef({});
    const sizeRef = useRef({ width: 1, height: 1 });
    // Camera: world-coordinates centre + zoom. Source of truth lives here.
    const viewRef = useRef({ cx: WORLD.width / 2, cy: WORLD.height / 2, k: 0.1 });
    const fitKRef = useRef(0.1);
    const dragRef = useRef(null);
    const tweenRef = useRef(null);
    // Set when a real pan just ended, so the click that follows it doesn't
    // clear the selected star.
    const suppressClickRef = useRef(false);
    const [ready, setReady] = useState(false);
    const [selected, setSelected] = useState(null);
    const [focused, setFocused] = useState(null);
    const [hintDismissed, setHintDismissed] = useState(false);
    // The hint returns whenever the camera is back out at overview zoom.
    const [zoomedOut, setZoomedOut] = useState(true);
    const zoomedOutRef = useRef(true);
    const overviewKRef = useRef(0.1);

    const dismissHint = useCallback(() => setHintDismissed(true), []);

    const constellations = useMemo(() => computeLayout(items), [items]);
    const dust = useMemo(() => computeDust(), []);

    // Overview framing: the constellation cluster (all six titles readable,
    // star labels still hidden), not the whole world — the sky continues
    // past it in every direction, inviting a wander.
    const overviewBox = useMemo(() => {
        const xs = [];
        const ys = [];
        constellations.forEach((c) => {
            xs.push(c.anchor.x);
            ys.push(c.anchor.y);
            c.stars.forEach((s) => {
                xs.push(s.x);
                ys.push(s.y);
            });
        });
        return {
            minX: Math.min(...xs) - OVERVIEW_PADDING,
            maxX: Math.max(...xs) + OVERVIEW_PADDING,
            minY: Math.min(...ys) - OVERVIEW_PADDING,
            maxY: Math.max(...ys) + OVERVIEW_PADDING,
        };
    }, [constellations]);

    const overviewTarget = useCallback(() => {
        const { width, height } = sizeRef.current;
        return {
            cx: (overviewBox.minX + overviewBox.maxX) / 2,
            cy: (overviewBox.minY + overviewBox.maxY) / 2,
            k: Math.min(
                width / (overviewBox.maxX - overviewBox.minX),
                height / (overviewBox.maxY - overviewBox.minY)
            ),
        };
    }, [overviewBox]);

    const clampView = useCallback((v) => {
        const { width, height } = sizeRef.current;
        const k = Math.min(Math.max(v.k, fitKRef.current), MAX_K);
        const viewW = width / k;
        const viewH = height / k;
        // Centre-lock an axis where the whole (overscroll-padded) world
        // fits; otherwise keep the visible rect inside the padded world.
        const cx =
            viewW >= WORLD.width + 2 * OVERSCROLL
                ? WORLD.width / 2
                : Math.min(
                      WORLD.width + OVERSCROLL - viewW / 2,
                      Math.max(viewW / 2 - OVERSCROLL, v.cx)
                  );
        const cy =
            viewH >= WORLD.height + 2 * OVERSCROLL
                ? WORLD.height / 2
                : Math.min(
                      WORLD.height + OVERSCROLL - viewH / 2,
                      Math.max(viewH / 2 - OVERSCROLL, v.cy)
                  );
        return { cx, cy, k };
    }, []);

    const applyView = useCallback((v) => {
        viewRef.current = v;
        const svg = svgRef.current;
        const { width, height } = sizeRef.current;
        const viewW = width / v.k;
        const viewH = height / v.k;
        svg.setAttribute(
            'viewBox',
            `${v.cx - viewW / 2} ${v.cy - viewH / 2} ${viewW} ${viewH}`
        );
        // Labels counter-scale by 1/k so they render at fixed screen size,
        // and their visibility follows zoom: star names appear as you move
        // closer, category names recede once you're inside a constellation.
        // Each dust layer follows the camera by a different fraction, so it
        // pans at (1 - factor)× the constellations' speed — layered depth.
        const px = v.cx - WORLD.width / 2;
        const py = v.cy - WORLD.height / 2;
        for (const { name, factor } of DUST_LAYERS) {
            dustLayerRefs.current[name]?.setAttribute(
                'transform',
                `translate(${px * factor} ${py * factor})`
            );
        }
        const isOut = v.k <= overviewKRef.current * 1.15;
        if (isOut !== zoomedOutRef.current) {
            zoomedOutRef.current = isOut;
            setZoomedOut(isOut);
        }
        svg.style.setProperty('--inv-k', 1 / v.k);
        svg.style.setProperty(
            '--star-label-opacity',
            Math.min(Math.max((v.k - 0.5) / 0.35, 0), 1) * 0.75
        );
        svg.style.setProperty(
            '--category-label-opacity',
            0.4 - 0.3 * Math.min(Math.max((v.k - 0.5) / 0.6, 0), 1)
        );
    }, []);

    const inertiaRef = useRef(null);

    const stopInertia = useCallback(() => {
        cancelAnimationFrame(inertiaRef.current);
        inertiaRef.current = null;
    }, []);

    const stopTween = useCallback(() => {
        cancelAnimationFrame(tweenRef.current);
        tweenRef.current = null;
    }, []);

    // Glide on after a flick: velocity in screen px/ms, exponential friction.
    const startInertia = useCallback(
        (vx, vy) => {
            if (Math.hypot(vx, vy) < 0.05) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            stopInertia();
            let lastTime = performance.now();
            let cvx = vx;
            let cvy = vy;
            const step = (now) => {
                const dt = now - lastTime;
                lastTime = now;
                const friction = Math.pow(0.994, dt);
                cvx *= friction;
                cvy *= friction;
                const v = viewRef.current;
                applyView(
                    clampView({
                        k: v.k,
                        cx: v.cx - (cvx * dt) / v.k,
                        cy: v.cy - (cvy * dt) / v.k,
                    })
                );
                inertiaRef.current =
                    Math.hypot(cvx, cvy) > 0.02 ? requestAnimationFrame(step) : null;
            };
            inertiaRef.current = requestAnimationFrame(step);
        },
        [applyView, clampView, stopInertia]
    );

    // Eased camera move (zoom interpolated in log space so it feels linear);
    // jump cut under prefers-reduced-motion.
    const animateTo = useCallback(
        (target) => {
            stopTween();
            stopInertia();
            const to = clampView(target);
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                applyView(to);
                return;
            }
            const from = viewRef.current;
            const logK = Math.log(from.k);
            const dLogK = Math.log(to.k) - logK;
            const start = performance.now();
            const step = (now) => {
                const t = Math.min((now - start) / TWEEN_MS, 1);
                const e = easeOutCubic(t);
                applyView(
                    clampView({
                        cx: from.cx + (to.cx - from.cx) * e,
                        cy: from.cy + (to.cy - from.cy) * e,
                        k: Math.exp(logK + dLogK * e),
                    })
                );
                tweenRef.current = t < 1 ? requestAnimationFrame(step) : null;
            };
            tweenRef.current = requestAnimationFrame(step);
        },
        [applyView, clampView, stopTween, stopInertia]
    );

    // Cancel any in-flight animation frames on unmount.
    useEffect(() => () => {
        stopTween();
        stopInertia();
    }, [stopTween, stopInertia]);

    // Selecting a star opens its note and glides the camera to frame the
    // star next to the panel (desktop) or above the bottom sheet (mobile).
    const selectStar = (item) => {
        setSelected(item);
        for (const constellation of constellations) {
            const star = constellation.stars.find((s) => s.item.id === item.id);
            if (!star) continue;
            const { width, height } = sizeRef.current;
            const k = Math.max(viewRef.current.k, SELECT_MIN_K);
            const isMobile = width <= MOBILE_BREAKPOINT;
            animateTo({
                k,
                cx: isMobile ? star.x : star.x + PANEL_CLEARANCE / k,
                cy: isMobile ? star.y + (0.2 * height) / k : star.y,
            });
            return;
        }
    };

    const focusConstellation = (key) => {
        const constellation = constellations.find((c) => c.key === key);
        if (!constellation || constellation.stars.length === 0) return;
        const xs = constellation.stars.map((s) => s.x).concat(constellation.anchor.x);
        const ys = constellation.stars.map((s) => s.y).concat(constellation.anchor.y);
        const minX = Math.min(...xs) - FOCUS_PADDING;
        const maxX = Math.max(...xs) + FOCUS_PADDING;
        const minY = Math.min(...ys) - FOCUS_PADDING;
        const maxY = Math.max(...ys) + FOCUS_PADDING;

        const { width, height } = sizeRef.current;
        animateTo({
            cx: (minX + maxX) / 2,
            cy: (minY + maxY) / 2,
            k: Math.min(width / (maxX - minX), height / (maxY - minY), FOCUS_MAX_K),
        });
        setFocused(key);
    };

    const resetView = () => {
        animateTo(overviewTarget());
        setFocused(null);
    };

    // Initial view (whole sky fitted and centred) + re-clamp on resize.
    useEffect(() => {
        const measure = () => {
            const rect = viewportRef.current.getBoundingClientRect();
            sizeRef.current = { width: rect.width, height: rect.height };
            fitKRef.current =
                Math.min(rect.width / WORLD.width, rect.height / WORLD.height) * 0.95;
        };
        measure();
        overviewKRef.current = overviewTarget().k;
        applyView(clampView(overviewTarget()));
        setReady(true);

        const onResize = () => {
            measure();
            overviewKRef.current = overviewTarget().k;
            applyView(clampView(viewRef.current));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [applyView, clampView, overviewTarget]);

    // Deep link: /map?star=<id> arrives on the overview, then glides to
    // that star with its card open — so posts and photos can point back
    // at the wish they came from.
    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('star');
        if (!id) return;
        const item = items.find((i) => i.id === id);
        if (!item) return;
        // After the initial view effect above has measured the viewport.
        const raf = requestAnimationFrame(() => selectStar(item));
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Wheel zoom toward the cursor. Attached natively because the listener
    // must be non-passive to preventDefault page scroll.
    useEffect(() => {
        const viewport = viewportRef.current;
        const onWheel = (e) => {
            // Wheel inside UI layers (note panel, its embedded map, index)
            // belongs to them — scrolling a note must not zoom the sky.
            if (e.target.closest?.('[data-sky-ui]')) return;
            e.preventDefault();
            stopTween();
            stopInertia();
            dismissHint();
            const v = viewRef.current;
            const rect = viewport.getBoundingClientRect();
            const sx = e.clientX - rect.left - rect.width / 2;
            const sy = e.clientY - rect.top - rect.height / 2;
            const k = Math.min(
                Math.max(v.k * Math.exp(-e.deltaY * 0.0015), fitKRef.current),
                MAX_K
            );
            // Keep the world point under the cursor fixed while scaling.
            applyView(
                clampView({
                    k,
                    cx: v.cx + sx / v.k - sx / k,
                    cy: v.cy + sy / v.k - sy / k,
                })
            );
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, [applyView, clampView, stopTween, stopInertia, dismissHint]);

    // Organic drift: a rAF loop owns per-star offsets (Lissajous-style, all
    // parameters seeded from the item id) and applies them to the star group
    // AND its line endpoints, so constellations drift as connected structures.
    // JS rather than CSS keyframes because lines must follow their stars —
    // and a future force-simulation drag mode can take over the same loop.
    useEffect(() => {
        if (!ready) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        const svg = svgRef.current;

        const drifters = [];
        constellations.forEach((c) =>
            c.stars.forEach((s) => {
                const el = svg.querySelector(`[data-star-id="${CSS.escape(s.item.id)}"]`);
                if (!el) return;
                const seed = hashString(s.item.id);
                drifters.push({
                    el,
                    id: s.item.id,
                    // Screen pixels — divided by the live zoom each frame so
                    // the drift is equally perceptible at every zoom level
                    // (in fixed world units it shrank to a sub-pixel crawl
                    // at overview).
                    ampX: 2.5 + (seed % 100) / 55,
                    ampY: 2.5 + ((seed >> 3) % 100) / 55,
                    freqX: 0.25 + ((seed >> 5) % 100) / 260,
                    freqY: 0.25 + ((seed >> 7) % 100) / 260,
                    phaseX: (seed % 6283) / 1000,
                    phaseY: ((seed >> 2) % 6283) / 1000,
                });
            })
        );
        const offsets = new Map();
        const edges = Array.from(svg.querySelectorAll('[data-edge-a]')).map((el) => ({
            el,
            a: el.dataset.edgeA,
            b: el.dataset.edgeB,
            x1: Number(el.getAttribute('x1')),
            y1: Number(el.getAttribute('y1')),
            x2: Number(el.getAttribute('x2')),
            y2: Number(el.getAttribute('y2')),
        }));

        let raf;
        const step = (now) => {
            const t = now / 1000;
            const { k } = viewRef.current;
            for (const d of drifters) {
                const dx = (d.ampX / k) * Math.sin(t * d.freqX + d.phaseX);
                const dy = (d.ampY / k) * Math.sin(t * d.freqY + d.phaseY);
                d.el.style.transform = `translate(${dx}px, ${dy}px)`;
                offsets.set(d.id, { dx, dy });
            }
            for (const e of edges) {
                const a = offsets.get(e.a);
                const b = offsets.get(e.b);
                if (a) {
                    e.el.setAttribute('x1', e.x1 + a.dx);
                    e.el.setAttribute('y1', e.y1 + a.dy);
                }
                if (b) {
                    e.el.setAttribute('x2', e.x2 + b.dx);
                    e.el.setAttribute('y2', e.y2 + b.dy);
                }
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [ready, constellations]);

    // Escape closes the note panel.
    useEffect(() => {
        if (!selected) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setSelected(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selected]);

    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopTween();
        stopInertia();
        dismissHint();
        suppressClickRef.current = false;
        const v = viewRef.current;
        dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startCx: v.cx,
            startCy: v.cy,
            captured: false,
        };
    };

    const onPointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag || e.pointerId !== drag.pointerId) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        // Capture only once this is clearly a pan — capturing on pointerdown
        // would retarget the pointerup and swallow star clicks.
        if (!drag.captured) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            drag.captured = true;
            viewportRef.current.setPointerCapture(e.pointerId);
            viewportRef.current.classList.add(styles.grabbing);
        }
        const { k } = viewRef.current;
        applyView(clampView({ k, cx: drag.startCx - dx / k, cy: drag.startCy - dy / k }));

        // Smoothed pointer velocity for release inertia.
        const now = performance.now();
        if (drag.lastTime != null) {
            const dt = now - drag.lastTime;
            if (dt > 0) {
                const vx = (e.clientX - drag.lastX) / dt;
                const vy = (e.clientY - drag.lastY) / dt;
                const blend = Math.min(dt / 50, 1);
                drag.vx = drag.vx == null ? vx : drag.vx + (vx - drag.vx) * blend;
                drag.vy = drag.vy == null ? vy : drag.vy + (vy - drag.vy) * blend;
            }
        }
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        drag.lastTime = now;
    };

    const endDrag = (e) => {
        const drag = dragRef.current;
        if (drag && e.pointerId === drag.pointerId) {
            suppressClickRef.current = drag.captured;
            dragRef.current = null;
            viewportRef.current.classList.remove(styles.grabbing);
            if (drag.captured) startInertia(drag.vx || 0, drag.vy || 0);
        }
    };

    const onViewportClick = () => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }
        // Click on empty sky (star clicks stop propagation) closes the panel.
        setSelected(null);
    };

    return (
        <section
            ref={viewportRef}
            className={styles.viewport}
            aria-label="Interactive star chart of aspirations"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={onViewportClick}
        >
            {/* viewBox is set imperatively only — declaring it as a prop would
                snap the camera back on every React re-render */}
            <svg
                ref={svgRef}
                className={styles.sky}
                style={{ visibility: ready ? 'visible' : 'hidden' }}
            >
                <defs>
                    {/* Soft-falloff glow: when its opacity animates, each ring
                        crosses a brightness step at a different moment, so the
                        pulse reads as breathing light instead of blinking. */}
                    <radialGradient id="star-glow-gradient">
                        <stop offset="0%" stopColor="#e0e0e0" stopOpacity="0.9" />
                        <stop offset="45%" stopColor="#e0e0e0" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#e0e0e0" stopOpacity="0" />
                    </radialGradient>
                </defs>
                {DUST_LAYERS.map(({ name }) => (
                    <g
                        key={name}
                        ref={(el) => {
                            dustLayerRefs.current[name] = el;
                        }}
                        aria-hidden="true"
                    >
                        {dust[name].map(renderDust)}
                    </g>
                ))}
                {constellations.map((constellation) => (
                    <Constellation
                        key={constellation.key}
                        constellation={constellation}
                        selectedId={selected?.id}
                        onSelectStar={selectStar}
                    />
                ))}
            </svg>
            <p
                className={`${styles.hint} ${
                    hintDismissed && !zoomedOut ? styles.hintHidden : ''
                }`}
                aria-hidden="true"
            >
                Drag to wander · Scroll to zoom · Click to wish upon a star
            </p>
            <ConstellationIndex
                focused={focused}
                onFocus={focusConstellation}
                onReset={resetView}
            />
            <NotePanel
                item={selected}
                groupItems={
                    selected
                        ? constellations
                              .find((c) => c.key === selected.category)
                              ?.stars.map((s) => s.item)
                        : null
                }
                onSelect={selectStar}
                onClose={() => setSelected(null)}
            />
        </section>
    );
};

export default StarChart;
