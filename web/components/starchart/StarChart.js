"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { WORLD, computeLayout, computeDust } from './layout';
import Constellation from './Constellation';
import styles from '../../styles/MapOfMe.module.css';

const StarChart = ({ items }) => {
    const viewportRef = useRef(null);
    // { x, y, scale } — world transform. Null until the viewport is measured.
    const [view, setView] = useState(null);

    const constellations = useMemo(() => computeLayout(items), [items]);
    const dust = useMemo(() => computeDust(), []);

    // Initial view: whole sky fitted and centred in the viewport.
    useEffect(() => {
        const rect = viewportRef.current.getBoundingClientRect();
        const scale = Math.min(rect.width / WORLD.width, rect.height / WORLD.height) * 0.95;
        setView({
            scale,
            x: (rect.width - WORLD.width * scale) / 2,
            y: (rect.height - WORLD.height * scale) / 2,
        });
    }, []);

    return (
        <section
            ref={viewportRef}
            className={styles.viewport}
            aria-label="Interactive star chart of aspirations"
        >
            <div
                className={styles.world}
                style={{
                    width: WORLD.width,
                    height: WORLD.height,
                    visibility: view ? 'visible' : 'hidden',
                    transform: view
                        ? `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`
                        : undefined,
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
