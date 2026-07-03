"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORLD, computeLayout, computeDust } from './layout';
import Constellation from './Constellation';
import styles from '../../styles/MapOfMe.module.css';

const MAX_SCALE = 1.75;

const StarChart = ({ items }) => {
    const viewportRef = useRef(null);
    const worldRef = useRef(null);
    // Transform source of truth lives in a ref and is applied directly to
    // the world element during gestures, so panning never re-renders React.
    const viewRef = useRef({ x: 0, y: 0, scale: 0.1 });
    const fitScaleRef = useRef(0.1);
    const dragRef = useRef(null);
    const [ready, setReady] = useState(false);

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
    }, [applyView, clampView]);

    const onPointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const v = viewRef.current;
        dragRef.current = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            viewX: v.x,
            viewY: v.y,
        };
        viewportRef.current.setPointerCapture(e.pointerId);
        viewportRef.current.classList.add(styles.grabbing);
    };

    const onPointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag || e.pointerId !== drag.pointerId) return;
        const v = viewRef.current;
        applyView(
            clampView({
                scale: v.scale,
                x: drag.viewX + (e.clientX - drag.startX),
                y: drag.viewY + (e.clientY - drag.startY),
            })
        );
    };

    const endDrag = (e) => {
        if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
            dragRef.current = null;
            viewportRef.current.classList.remove(styles.grabbing);
        }
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
                        <Constellation key={constellation.key} constellation={constellation} />
                    ))}
                </svg>
            </div>
        </section>
    );
};

export default StarChart;
