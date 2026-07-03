import styles from '../../styles/MapOfMe.module.css';

// Always mounted so the aria-live region exists before a star is chosen;
// visually shown only when an item is selected.
const NotePanel = ({ item, onClose }) => {
    return (
        <aside
            className={`${styles.notePanel} ${item ? styles.notePanelOpen : ''}`}
            aria-live="polite"
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
                </div>
            )}
        </aside>
    );
};

export default NotePanel;
