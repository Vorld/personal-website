import { CATEGORIES } from './StarChart/layout';
import styles from '../styles/Map.module.css';

// Server-rendered plain-text fallback below the star chart: crawlable HTML
// for every aspiration and a first-class path for screen readers and
// keyboard users who would rather skip the interactive sky.
const AspirationList = ({ aspirations }) => {
    if (!aspirations?.length) return null;
    return (
        <details className={styles.listFallback}>
            <summary className={styles.listSummary}>Prefer a plain list?</summary>
            {CATEGORIES.map((cat) => {
                const inCategory = aspirations.filter((a) => a.category === cat.key);
                if (!inCategory.length) return null;
                return (
                    <section key={cat.key}>
                        <h2 className={styles.listCategory}>{cat.label}</h2>
                        <ul className={styles.listItems}>
                            {inCategory.map((aspiration) => (
                                <li key={aspiration.id} className={styles.listItem}>
                                    <p className={styles.listItemTitle}>
                                        {aspiration.title}
                                        {aspiration.placeName ? ` — ${aspiration.placeName}` : ''}
                                        {aspiration.done
                                            ? ` ✦ done${
                                                  aspiration.completedAt
                                                      ? ` ${aspiration.completedAt.slice(0, 4)}`
                                                      : ''
                                              }`
                                            : ''}
                                    </p>
                                    {aspiration.noteText && (
                                        <p className={styles.listItemNote}>{aspiration.noteText}</p>
                                    )}
                                    {aspiration.postscriptText && (
                                        <p className={styles.listItemNote}>
                                            — {aspiration.postscriptText}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </details>
    );
};

export default AspirationList;
