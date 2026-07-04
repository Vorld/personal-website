"use client";

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PortableText } from '@portabletext/react';
import styles from '../../styles/Map.module.css';

// MapLibre is heavy — it loads only the first time a visit star is opened.
const PlaceMap = dynamic(() => import('./PlaceMap'), {
    ssr: false,
    loading: () => <p className={styles.placeMapLoading}>finding the earth…</p>,
});

// The note and postscript are the blog's blockContent, but the card is a
// prose surface: links and emphasis render, the blog's heavy blocks
// (code, PDFs, math, inline images) are ignored rather than dragging
// their renderers into the map bundle. The card's one image lives in the
// media slot instead.
const proseComponents = {
    types: {
        image: () => null,
        code: () => null,
        file: () => null,
        latex: () => null,
        poetry: () => null,
    },
    marks: {
        link: ({ value, children }) => (
            <a className={styles.cardNoteLink} href={value?.href}>
                {children}
            </a>
        ),
    },
};

// Always mounted so the aria-live region exists before a star is chosen;
// visually shown only when an aspiration is selected. The card is the same
// for every star; the media slot below the note holds the place map for
// visit aspirations, or the aspiration's image (linked to its photo-gallery
// lightbox when the same asset is in the gallery).
const StarCard = ({ aspiration, siblings, onSelect, onClose }) => {
    const [renderedAspiration, setRenderedAspiration] = useState(aspiration);
    const [renderedSiblings, setRenderedSiblings] = useState(siblings);

    useEffect(() => {
        if (aspiration) {
            const timeout = setTimeout(() => {
                setRenderedAspiration(aspiration);
                setRenderedSiblings(siblings);
            }, 0);

            return () => clearTimeout(timeout);
        }

        const timeout = setTimeout(() => {
            setRenderedAspiration(null);
            setRenderedSiblings(null);
        }, 300);

        return () => clearTimeout(timeout);
    }, [aspiration, siblings]);

    const shown = aspiration || renderedAspiration;
    const shownSiblings = aspiration ? siblings : renderedSiblings;

    const count = shownSiblings?.length || 0;
    const index = shown && count ? shownSiblings.findIndex((a) => a.id === shown.id) : -1;
    const prev = index >= 0 && count > 1 ? shownSiblings[(index - 1 + count) % count] : null;
    const next = index >= 0 && count > 1 ? shownSiblings[(index + 1) % count] : null;

    const isPlace = Boolean(shown?.category === 'visit' && shown?.location);
    const placeSiblings = isPlace ? (shownSiblings || []).filter((a) => a.location) : null;
    const hasImage = Boolean(!isPlace && shown?.image?.url);
    const completedYear = shown?.completedAt?.slice(0, 4);

    const image = hasImage && (
        <Image
            src={shown.image.url}
            alt={shown.title}
            fill
            sizes="380px"
            style={{ objectFit: 'cover' }}
        />
    );

    return (
        <aside
            className={`${styles.card} ${aspiration ? styles.cardOpen : ''}`}
            aria-live="polite"
            data-sky-ui
            // Interactions inside the card must not pan the sky or count as
            // an empty-sky click (which would close the card).
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            {shown && (
                <div className={styles.cardInner}>
                    {isPlace && (
                        // Outside the keyed content so the map instance
                        // survives prev/next and flies between places.
                        <div className={`${styles.cardMedia} ${styles.cardMediaPlace}`}>
                            <PlaceMap
                                aspirations={placeSiblings}
                                selectedId={shown.id}
                                onSelect={onSelect}
                            />
                        </div>
                    )}
                    {hasImage && (
                        <div className={styles.cardMedia} key={`media-${shown.id}`}>
                            {shown.photoKey ? (
                                <a
                                    className={styles.cardImageLink}
                                    href={`/photos?photo=${shown.photoKey}`}
                                    aria-label="See this photo in the gallery"
                                >
                                    {image}
                                </a>
                            ) : (
                                image
                            )}
                        </div>
                    )}
                    <div key={shown.id} className={styles.cardContent}>
                        <button
                            className={styles.cardClose}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <p className={styles.cardKicker}>
                            {shown.category}
                            {shown.subcategory ? ` · ${shown.subcategory}` : ''}
                        </p>
                        <h2 className={styles.cardTitle}>{shown.title}</h2>
                        {shown.placeName && <p className={styles.cardPlace}>{shown.placeName}</p>}
                        {shown.done && (
                            <p className={styles.cardCompleted}>
                                Completed{completedYear ? ` in ${completedYear}` : ''}
                            </p>
                        )}
                        {shown.note?.length > 0 && (
                            <div className={styles.cardNote}>
                                <PortableText value={shown.note} components={proseComponents} />
                            </div>
                        )}
                        {shown.postscript?.length > 0 && (
                            <div className={styles.cardPostscript}>
                                <PortableText
                                    value={shown.postscript}
                                    components={proseComponents}
                                />
                            </div>
                        )}
                        {count > 1 && (
                            <div className={styles.cardNav}>
                                <button
                                    className={styles.cardNavButton}
                                    onClick={() => onSelect(prev)}
                                    aria-label={`Previous: ${prev.title}`}
                                >
                                    ←
                                </button>
                                <span className={styles.cardNavCount}>
                                    {index + 1} / {count}
                                </span>
                                <button
                                    className={styles.cardNavButton}
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

export default StarCard;
