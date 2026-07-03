"use client";

import dynamic from 'next/dynamic';
import styles from '../../styles/MapOfMe.module.css';

// MapLibre is heavy — it loads only the first time a visit star is opened.
const GeoMap = dynamic(() => import('./GeoMap'), {
    ssr: false,
    loading: () => <p className={styles.geoLoading}>finding the earth…</p>,
});

// Always mounted so the aria-live region exists before a star is chosen;
// visually shown only when an item is selected. Visit items add the
// geographic map below the note; everything else about the card is the
// same for every star.
const NotePanel = ({ item, groupItems, onSelect, onClose }) => {
    const count = groupItems?.length || 0;
    const index = item && count ? groupItems.findIndex((i) => i.id === item.id) : -1;
    const prev = index >= 0 && count > 1 ? groupItems[(index - 1 + count) % count] : null;
    const next = index >= 0 && count > 1 ? groupItems[(index + 1) % count] : null;

    const isPlace = Boolean(item?.category === 'visit' && item?.location);
    const placeItems = isPlace ? groupItems.filter((i) => i.location) : null;

    return (
        <aside
            className={`${styles.notePanel} ${item ? styles.notePanelOpen : ''}`}
            aria-live="polite"
            data-sky-ui
            // Interactions inside the panel must not pan the sky or count as
            // an empty-sky click (which would close the panel).
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {item && (
                <div className={styles.notePanelInner}>
                    {isPlace && (
                        // Outside the keyed content so the map instance
                        // survives prev/next and flies between places.
                        <div className={styles.noteMap}>
                            <GeoMap
                                items={placeItems}
                                selectedId={item.id}
                                onSelect={onSelect}
                            />
                        </div>
                    )}
                    <div key={item.id} className={styles.noteContent}>
                        <button
                            className={styles.noteClose}
                            onClick={onClose}
                            aria-label="Close note"
                        >
                            ×
                        </button>
                        <p className={styles.noteKicker}>
                            {item.category}
                            {item.subcategory ? ` · ${item.subcategory}` : ''}
                            {item.status === 'done'
                                ? ` · done${item.completedAt ? ` · ${item.completedAt}` : ''}`
                                : ''}
                        </p>
                        <h2 className={styles.noteTitle}>{item.title}</h2>
                        {item.placeName && <p className={styles.notePlace}>{item.placeName}</p>}
                        {item.note && <p className={styles.noteBody}>{item.note}</p>}
                        {item.postscript && (
                            <p className={styles.notePostscript}>— {item.postscript}</p>
                        )}
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
                </div>
            )}
        </aside>
    );
};

export default NotePanel;
