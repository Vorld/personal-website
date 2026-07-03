import styles from '../../styles/MapOfMe.module.css';

// Always mounted so the aria-live region exists before a star is chosen;
// visually shown only when an item is selected.
const NotePanel = ({ item, groupItems, onSelect, onClose }) => {
    const count = groupItems?.length || 0;
    const index = item && count ? groupItems.findIndex((i) => i.id === item.id) : -1;
    const prev = index >= 0 && count > 1 ? groupItems[(index - 1 + count) % count] : null;
    const next = index >= 0 && count > 1 ? groupItems[(index + 1) % count] : null;

    return (
        <aside
            className={`${styles.notePanel} ${item ? styles.notePanelOpen : ''}`}
            aria-live="polite"
            // Interactions inside the panel must not pan the sky or count as
            // an empty-sky click (which would close the panel).
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {item && (
                <div key={item.id} className={styles.notePanelInner}>
                    <button className={styles.noteClose} onClick={onClose} aria-label="Close note">
                        ×
                    </button>
                    <p className={styles.noteKicker}>
                        {item.category}
                        {item.subcategory ? ` · ${item.subcategory}` : ''}
                    </p>
                    <h2 className={styles.noteTitle}>{item.title}</h2>
                    {item.placeName && <p className={styles.notePlace}>{item.placeName}</p>}
                    {item.note && <p className={styles.noteBody}>{item.note}</p>}
                    {count > 1 && (
                        <div className={styles.noteNav}>
                            <button
                                className={styles.noteNavButton}
                                onClick={() => onSelect(prev)}
                                aria-label={`Previous: ${prev.title}`}
                            >
                                ←
                            </button>
                            <span className={styles.noteNavCount}>
                                {index + 1} / {count}
                            </span>
                            <button
                                className={styles.noteNavButton}
                                onClick={() => onSelect(next)}
                                aria-label={`Next: ${next.title}`}
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};

export default NotePanel;
