"use client";

import styles from '../../styles/MapOfMe.module.css';

const CATEGORY_ORDER = ['visit', 'learn', 'make', 'consume', 'do', 'get'];

// Placeholder skeleton: renders the aspirations as grouped lists while the
// actual star chart is built up in subsequent commits.
const StarChart = ({ items }) => {
    return (
        <section className={styles.viewport} aria-label="Map of aspirations">
            {CATEGORY_ORDER.map((category) => {
                const group = items.filter((item) => item.category === category);
                if (group.length === 0) return null;

                return (
                    <div key={category} className={styles.skeletonGroup}>
                        <h2>{category.toUpperCase()}</h2>
                        <ul>
                            {group.map((item) => (
                                <li key={item.id}>
                                    <strong>{item.title}</strong> — {item.note}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </section>
    );
};

export default StarChart;
