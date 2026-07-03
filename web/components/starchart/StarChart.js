"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORLD, computeLayout, computeDust } from './layout';
import Constellation from './Constellation';
import ConstellationIndex from './ConstellationIndex';
import NotePanel from './NotePanel';
import styles from '../../styles/MapOfMe.module.css';

const MAX_SCALE = 1.75;
// Don't zoom in past this when focusing a constellation — keeps small
// two-star groups from filling the screen.
const FOCUS_MAX_SCALE = 1.1;
const FOCUS_PADDING = 140;
const DRAG_THRESHOLD = 5;

const StarChart = ({ items }) => {
    const viewportRef = useRef(null);
    const worldRef = useRef(null);
    // Transform source of truth lives in a ref and is applied directly to
    // the world element during gestures, so panning never re-renders React.
    const viewRef = useRef({ x: 0, y: 0, scale: 0.1 });
    const fitScaleRef = useRef(0.1);
    const dragRef = useRef(null);
    // Set when a real pan just ended, so the click that follows it doesn't
    // clear the selected star.
    const suppressClickRef = useRef(false);
    const animTimeoutRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [selected, setSelected] = useState(null);
    const [focused, setFocused] = useState(null);

    const constellations = useMemo(() => computeLayout(items), [items]);
    const dust = useMemo(() => computeDust(), []);

    const clampView = useCallback((v) => {
        const rect = viewportRef.current.getBoundingClientRect();
        const scale = Math.min(Math.max(v.scale, fitScaleRef.current), MAX_SCALE);
        const worldW = WORLD.width * scale;
        const worldH = WORLD.height * scale;
        // Lock to centre on an axis where the world is smaller than the
        // viewport; otherwise keep the world covering the viewport.
        const x =
            worldW <= rect.width
                ? (rect.width - worldW) / 2
                : Math.min(0, Math.max(rect.width - worldW, v.x));
        const y =
            worldH <= rect.height
                ? (rect.height - worldH) / 2
                : Math.min(0, Math.max(rect.height - worldH, v.y));
        return { x, y, scale };
    }, []);

    const applyView = useCallback((v) => {
        viewRef.current = v;
        worldRef.current.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.scale})`;
    }, []);

    const stopAnimation = useCallback(() => {
        clearTimeout(animTimeoutRef.current);
        worldRef.current.classList.remove(styles.animating);
    }, []);

    // Apply a view with the eased CSS transition (a no-op jump cut under
    // prefers-reduced-motion, where the .animating class has no transition).
    const animateTo = useCallback(
        (v) => {
            stopAnimation();
            worldRef.current.classList.add(styles.animating);
            applyView(clampView(v));
            animTimeoutRef.current = setTimeout(() => {
                worldRef.current.classList.remove(styles.animating);
            }, 750);
        },
        [applyView, clampView, stopAnimation]
    );

    // Initial view (whole sky fitted and centred) + re-clamp on resize.
    useEffect(() => {
        const setFitScale = () => {
            const rect = viewportRef.current.getBoundingClientRect();
            fitScaleRef.current =
                Math.min(rect.width / WORLD.width, rect.height / WORLD.height) * 0.95;
        };
        setFitScale();
        applyView(clampView({ x: 0, y: 0, scale: fitScaleRef.current }));
        setReady(true);

        const onResize = () => {
            setFitScale();
            applyView(clampView(viewRef.current));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [applyView, clampView]);

    // Wheel zoom toward the cursor. Attached natively because the listener
    // must be non-passive to preventDefault page scroll.
    useEffect(() => {
        const viewport = viewportRef.current;
        const onWheel = (e) => {
            e.preventDefault();
            stopAnimation();
            const v = viewRef.current;
            const rect = viewport.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const scale = Math.min(
                Math.max(v.scale * Math.exp(-e.deltaY * 0.0015), fitScaleRef.current),
                MAX_SCALE
            );
            // Keep the world point under the cursor fixed while scaling.
            const worldX = (cursorX - v.x) / v.scale;
            const worldY = (cursorY - v.y) / v.scale;
            applyView(
                clampView({ scale, x: cursorX - worldX * scale, y: cursorY - worldY * scale })
            );
        };
        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, [applyView, clampView, stopAnimation]);

    const focusConstellation = (key) => {
        const constellation = constellations.find((c) => c.key === key);
        if (!constellation || constellation.stars.length === 0) return;
        const xs = constellation.stars.map((s) => s.x).concat(constellation.anchor.x);
        const ys = constellation.stars.map((s) => s.y).concat(constellation.anchor.y);
        const minX = Math.min(...xs) - FOCUS_PADDING;
        const maxX = Math.max(...xs) + FOCUS_PADDING;
        const minY = Math.min(...ys) - FOCUS_PADDING;
        const maxY = Math.max(...ys) + FOCUS_PADDING;

        const rect = viewportRef.current.getBoundingClientRect();
        const scale = Math.min(
            rect.width / (maxX - minX),
            rect.height / (maxY - minY),
            FOCUS_MAX_SCALE
        );
        animateTo({
            scale,
            x: rect.width / 2 - ((minX + maxX) / 2) * scale,
            y: rect.height / 2 - ((minY + maxY) / 2) * scale,
        });
        setFocused(key);
    };

    const resetView = () => {
        const rect = viewportRef.current.getBoundingClientRect();
        const scale = fitScaleRef.current;
        animateTo({
            scale,
            x: (rect.width - WORLD.width * scale) / 2,
            y: (rect.height - WORLD.height * scale) / 2,
        });
        setFocused(null);
    };

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
        stopAnimation();
        suppressClickRef.current = false;
        const v = viewRef.current;
        dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            viewX: v.x,
            viewY: v.y,
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
        const v = viewRef.current;
        applyView(
            clampView({
                scale: v.scale,
                x: drag.viewX + dx,
                y: drag.viewY + dy,
            })
        );
    };

    const endDrag = (e) => {
        const drag = dragRef.current;
        if (drag && e.pointerId === drag.pointerId) {
            suppressClickRef.current = drag.captured;
            dragRef.current = null;
            viewportRef.current.classList.remove(styles.grabbing);
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
            <div
                ref={worldRef}
                className={styles.world}
                style={{
                    width: WORLD.width,
                    height: WORLD.height,
                    visibility: ready ? 'visible' : 'hidden',
                }}
            >
                <svg
                    className={styles.sky}
                    viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
                    width={WORLD.width}
                    height={WORLD.height}
                >
                    <g aria-hidden="true">
                        {dust.map((d) => (
                            <circle
                                key={d.id}
                                className={styles.dust}
                                cx={d.x}
                                cy={d.y}
                                r={d.r}
                                opacity={d.opacity}
                            />
                        ))}
                    </g>
                    {constellations.map((constellation) => (
                        <Constellation
                            key={constellation.key}
                            constellation={constellation}
                            selectedId={selected?.id}
                            onSelectStar={setSelected}
                        />
                    ))}
                </svg>
            </div>
            <ConstellationIndex
                focused={focused}
                onFocus={focusConstellation}
                onReset={resetView}
            />
            <NotePanel item={selected} onClose={() => setSelected(null)} />
        </section>
    );
};

export default StarChart;
