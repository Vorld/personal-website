import styles from '../../styles/MapOfMe.module.css';

const Star = ({ star }) => {
    const { item, x, y, r } = star;

    return (
        <g className={styles.star}>
            <circle className={styles.starGlow} cx={x} cy={y} r={r * 3} aria-hidden="true" />
            <circle className={styles.starCore} cx={x} cy={y} r={r} />
            <text className={styles.starLabel} x={x} y={y - r * 3 - 8} textAnchor="middle">
                {item.title}
            </text>
        </g>
    );
};

export default Star;
