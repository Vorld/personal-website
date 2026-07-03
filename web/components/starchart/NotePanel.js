"use client";

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PortableText } from '@portabletext/react';
import styles from '../../styles/MapOfMe.module.css';

// MapLibre is heavy — it loads only the first time a visit star is opened.
const GeoMap = dynamic(() => import('./GeoMap'), {
    ssr: false,
    loading: () => <p className={styles.geoLoading}>finding the earth…</p>,
});

// The note and postscript are the blog's blockContent, but the card is a
// prose surface: links and emphasis render, the blog's heavy blocks
// (code, PDFs, math, inline images) are ignored rather than dragging
// their renderers into the map bundle. The card's one image lives in the
// media slot instead.
const noteComponents = {
    types: {
        image: () => null,
        code: () => null,
        file: () => null,
        latex: () => null,
        poetry: () => null,
    },
    marks: {
        link: ({ value, children }) => (
            <a className={styles.noteLink} href={value?.href}>
                {children}
            </a>
        ),
    },
};

// Always mounted so the aria-live region exists before a star is chosen;
// visually shown only when an item is selected. The card is the same for
// every star; the media slot below the note holds the geographic map for
// visit items, or the item's image (linked to its photo-gallery lightbox
// when the same asset is in the gallery).
const NotePanel = ({ item, groupItems, onSelect, onClose }) => {
    const [renderedItem, setRenderedItem] = useState(item);
    const [renderedGroupItems, setRenderedGroupItems] = useState(groupItems);

    useEffect(() => {
        if (item) {
            const timeout = setTimeout(() => {
                setRenderedItem(item);
                setRenderedGroupItems(groupItems);
            }, 0);

            return () => clearTimeout(timeout);
        }

        const timeout = setTimeout(() => {
            setRenderedItem(null);
            setRenderedGroupItems(null);
        }, 300);

        return () => clearTimeout(timeout);
    }, [item, groupItems]);

    const displayItem = item || renderedItem;
    const displayGroupItems = item ? groupItems : renderedGroupItems;

    const count = displayGroupItems?.length || 0;
    const index =
        displayItem && count ? displayGroupItems.findIndex((i) => i.id === displayItem.id) : -1;
    const prev = index >= 0 && count > 1 ? displayGroupItems[(index - 1 + count) % count] : null;
    const next = index >= 0 && count > 1 ? displayGroupItems[(index + 1) % count] : null;

    const isPlace = Boolean(displayItem?.category === 'visit' && displayItem?.location);
    const placeItems = isPlace ? (displayGroupItems || []).filter((i) => i.location) : null;
    const hasImage = Boolean(!isPlace && displayItem?.image?.url);
    const completedYear = displayItem?.completedAt?.slice(0, 4);

    const image = hasImage && (
        <Image
            src={displayItem.image.url}
            alt={displayItem.title}
            fill
            sizes="380px"
            style={{ objectFit: 'cover' }}
        />
    );

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
            {displayItem && (
                <div className={styles.notePanelInner}>
                    {isPlace && (
                        // Outside the keyed content so the map instance
                        // survives prev/next and flies between places.
                        <div className={`${styles.noteMap} ${styles.noteGeoMap}`}>
                            <GeoMap
                                items={placeItems}
                                selectedId={displayItem.id}
                                onSelect={onSelect}
                            />
                        </div>
                    )}
                    {hasImage && (
                        <div className={styles.noteMap} key={`media-${displayItem.id}`}>
                            {displayItem.photoKey ? (
                                <a
                                    className={styles.noteImageLink}
                                    href={`/photos?photo=${displayItem.photoKey}`}
                                    aria-label={`See this photo in the gallery`}
                                >
                                    {image}
                                </a>
                            ) : (
                                image
                            )}
                        </div>
                    )}
                    <div key={displayItem.id} className={styles.noteContent}>
                        <button
                            className={styles.noteClose}
                            onClick={onClose}
                            aria-label="Close note"
                        >
                            ×
                        </button>
                        <p className={styles.noteKicker}>
                            {displayItem.category}
                            {displayItem.subcategory ? ` · ${displayItem.subcategory}` : ''}
                        </p>
                        <h2 className={styles.noteTitle}>{displayItem.title}</h2>
                        {displayItem.placeName && (
                            <p className={styles.notePlace}>{displayItem.placeName}</p>
                        )}
                        {displayItem.done && (
                            <p className={styles.noteCompleted}>
                                Completed{completedYear ? ` in ${completedYear}` : ''}
                            </p>
                        )}
                        {displayItem.note?.length > 0 && (
                            <div className={styles.noteBody}>
                                <PortableText
                                    value={displayItem.note}
                                    components={noteComponents}
                                />
                            </div>
                        )}
                        {displayItem.postscript?.length > 0 && (
                            <div className={styles.notePostscript}>
                                <PortableText
                                    value={displayItem.postscript}
                                    components={noteComponents}
                                />
                            </div>
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
