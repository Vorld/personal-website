import styles from '../../styles/MapOfMe.module.css';

const Star = ({ star, selected, onSelect }) => {
    const { item, x, y, r } = star;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
        }
    };

    return (
        <g
            className={`${styles.star} ${selected ? styles.starSelected : ''}`}
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
            <circle className={styles.starGlow} cx={x} cy={y} r={r * 3} aria-hidden="true" />
            {selected && (
                <circle className={styles.starRing} cx={x} cy={y} r={r + 8} aria-hidden="true" />
            )}
            <circle className={styles.starCore} cx={x} cy={y} r={r} />
            <text className={styles.starLabel} x={x} y={y - r * 3 - 8} textAnchor="middle">
                {item.title}
            </text>
        </g>
    );
};

export default Star;
