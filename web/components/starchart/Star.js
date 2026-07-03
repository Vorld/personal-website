import { hashString } from './layout';
import styles from '../../styles/MapOfMe.module.css';

// Four-point sparkle: each quarter is a quadratic curve whose control point
// sits at the centre, giving the concave sweep between the points.
const sparklePath = (x, y, R) =>
    `M ${x} ${y - R} Q ${x} ${y} ${x + R} ${y} Q ${x} ${y} ${x} ${y + R} ` +
    `Q ${x} ${y} ${x - R} ${y} Q ${x} ${y} ${x} ${y - R} Z`;

const Star = ({ star, selected, onSelect }) => {
    const { item, x, y, r } = star;
    // Deterministic stagger so the glow pulses aren't in lockstep.
    const pulseDelay = `${(hashString(item.id) % 7000) / 1000}s`;
    // The label anchors to the star's top edge (sparkles reach 2× the dot
    // radius), so the screen-pixel gap below it stays clear at any zoom.
    const topExtent = item.status === 'done' ? r * 2 : r;

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
            {selected && (
                <circle className={styles.starRing} cx={x} cy={y} r={r + 8} aria-hidden="true" />
            )}
            {item.status === 'done' ? (
                // Done aspirations are "risen": the dot becomes a sparkle.
                <path className={styles.starSparkle} d={sparklePath(x, y, r * 2)} />
            ) : (
                <circle className={styles.starCore} cx={x} cy={y} r={r} />
            )}
            <text
                className={styles.starLabel}
                y={-10}
                textAnchor="middle"
                style={{
                    transform: `translate(${x}px, ${y - topExtent}px) scale(var(--inv-k, 1))`,
                }}
            >
                {item.title}
            </text>
        </g>
    );
};

export default Star;
