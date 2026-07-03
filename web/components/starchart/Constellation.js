import Star from './Star';
import styles from '../../styles/MapOfMe.module.css';

const Constellation = ({ constellation, selectedId, onSelectStar }) => {
    const { label, anchor, stars, edges } = constellation;

    return (
        <g>
            {edges.map(([i, j], k) => (
                <line
                    key={k}
                    className={styles.edge}
                    x1={stars[i].x}
                    y1={stars[i].y}
                    x2={stars[j].x}
                    y2={stars[j].y}
                    data-edge-a={stars[i].item.id}
                    data-edge-b={stars[j].item.id}
                    vectorEffect="non-scaling-stroke"
                    aria-hidden="true"
                />
            ))}
            <text
                className={styles.categoryLabel}
                textAnchor="middle"
                style={{
                    transform: `translate(${anchor.x}px, ${anchor.y}px) scale(var(--inv-k, 1))`,
                }}
                aria-hidden="true"
            >
                {label}
            </text>
            {stars.map((star) => (
                <Star
                    key={star.item.id}
                    star={star}
                    selected={star.item.id === selectedId}
                    onSelect={onSelectStar}
                />
            ))}
        </g>
    );
};

export default Constellation;
