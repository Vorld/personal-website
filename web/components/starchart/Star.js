import { hashString } from './layout';
import styles from '../../styles/MapOfMe.module.css';

// Unit vectors (cos/sin 45°) for the done-star rays.
const D = Math.SQRT1_2;
const DIAGONALS = [
    [D, -D],
    [D, D],
    [-D, D],
    [-D, -D],
];

const Star = ({ star, selected, onSelect }) => {
    const { item, x, y, r } = star;
    // Deterministic stagger so the glow pulses aren't in lockstep.
    const pulseDelay = `${(hashString(item.id) % 7000) / 1000}s`;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
        }
    };

    return (
        <g
            className={`${styles.star} ${selected ? styles.starSelected : ''} ${
                item.status === 'done' ? styles.starDone : ''
            }`}
            data-star-id={item.id}
            role="button"
            tabIndex={0}
            aria-label={`${item.title} — read why`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Generous invisible hit target — the visible dot is tiny at overview zoom */}
            <circle className={styles.starHit} cx={x} cy={y} r={26} aria-hidden="true" />
            <circle
                className={styles.starGlow}
                cx={x}
                cy={y}
                r={r * 3.5}
                fill="url(#star-glow-gradient)"
                style={{ animationDelay: pulseDelay }}
                aria-hidden="true"
            />
            {item.status === 'done' && (
                // Four short diagonal rays with a gap around the core — a
                // "risen" star. Diagonal (not orthogonal) so they read as a
                // sparkle rather than a crosshair and stay clear of the
                // label above.
                <g className={styles.starSpikes} aria-hidden="true">
                    {DIAGONALS.map(([sx, sy], i) => (
                        <line
                            key={i}
                            x1={x + sx * r * 1.2}
                            y1={y + sy * r * 1.2}
                            x2={x + sx * r * 2.2}
                            y2={y + sy * r * 2.2}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </g>
            )}
            {selected && (
                <circle className={styles.starRing} cx={x} cy={y} r={r + 8} aria-hidden="true" />
            )}
            <circle className={styles.starCore} cx={x} cy={y} r={r} />
            <text
                className={styles.starLabel}
                y={-16}
                textAnchor="middle"
                style={{ transform: `translate(${x}px, ${y}px) scale(var(--inv-k, 1))` }}
            >
                {item.title}
            </text>
        </g>
    );
};

export default Star;
