import { CATEGORIES } from './starchart/layout';
import styles from '../styles/MapOfMe.module.css';

// Server-rendered plain-text fallback below the star chart: crawlable HTML
// for every aspiration and a first-class path for screen readers and
// keyboard users who would rather skip the interactive sky.
const AspirationList = ({ items }) => {
    if (!items?.length) return null;
    return (
        <details className={styles.listFallback}>
            <summary className={styles.listSummary}>Prefer a plain list?</summary>
            {CATEGORIES.map((cat) => {
                const catItems = items.filter((item) => item.category === cat.key);
                if (!catItems.length) return null;
                return (
                    <section key={cat.key}>
                        <h2 className={styles.listCategory}>{cat.label}</h2>
                        <ul className={styles.listItems}>
                            {catItems.map((item) => (
                                <li key={item.id} className={styles.listItem}>
                                    <p className={styles.listItemTitle}>
                                        {item.title}
                                        {item.placeName ? ` — ${item.placeName}` : ''}
                                        {item.done
                                            ? ` ✦ done${
                                                  item.completedAt
                                                      ? ` ${item.completedAt.slice(0, 4)}`
                                                      : ''
                                              }`
                                            : ''}
                                    </p>
                                    {item.noteText && (
                                        <p className={styles.listItemNote}>{item.noteText}</p>
                                    )}
                                    {item.postscriptText && (
                                        <p className={styles.listItemNote}>— {item.postscriptText}</p>
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
