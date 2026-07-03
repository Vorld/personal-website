'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Lightbox from './Lightbox'; // We'll create this next
import styles from '../styles/Photos.module.css'; // Reuse existing styles for the grid

const PhotoGallery = ({ images }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setLightboxOpen(true);
        // Permalink for the opened photo, so it can be shared and linked
        // to from elsewhere on the site (e.g. the map's aspiration cards).
        window.history.replaceState(null, '', `?photo=${images[index].id}`);
    };

    const handleCloseLightbox = () => {
        setLightboxOpen(false);
        setSelectedImageIndex(null);
        window.history.replaceState(null, '', window.location.pathname);
    };

    // /photos?photo=<id> opens the lightbox on that photo. Read on the
    // client so the page itself stays static.
    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('photo');
        if (!id) return;
        const index = images.findIndex((image) => image.id === id);
        if (index >= 0) {
            setSelectedImageIndex(index);
            setLightboxOpen(true);
        }
    }, [images]);

    // Ensure images is an array before mapping
    if (!Array.isArray(images)) {
        console.error("PhotoGallery received invalid images prop:", images);
        return <div>Error loading images.</div>; // Or some other fallback UI
    }

    return (
        <>
            <div className={styles.container}>
                {images.map((image, index) => {
                    // Basic check for essential data
                    if (!image?.url || !image?.dimensions || !image?.id) return null;
                    return (
                        <div
                            key={image.id}
                            className={styles.imageWrapper}
                            onClick={() => handleImageClick(index)}
                        >
                            <Image
                                src={image.url}
                                alt={image.caption || "Gallery image"}
                                className={styles.image}
                                width={image.dimensions.width}
                                height={image.dimensions.height}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={75}
                                priority={index < 6} // Prioritize loading first few images
                            />
                        </div>
                    );
                })}
            </div>

            {lightboxOpen && selectedImageIndex !== null && (
                <Lightbox
                    images={images}
                    initialIndex={selectedImageIndex}
                    onClose={handleCloseLightbox}
                />
            )}
        </>
    );
};

export default PhotoGallery;