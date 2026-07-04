"use client";

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from '../../styles/Map.module.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const PLACE_ZOOM = 4.5;

// Embedded in the visit star card: opens on the selected place, shows all
// visit pins for context, and flies between them as the card tours.
const PlaceMap = ({ aspirations, selectedId, onSelect }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const firstRenderRef = useRef(true);
    // Keep the latest callback/selection without re-initialising the map.
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const initialIdRef = useRef(selectedId);

    useEffect(() => {
        const initial = aspirations.find((a) => a.id === initialIdRef.current);
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: STYLE_URL,
            center: [initial.location.lng, initial.location.lat],
            zoom: PLACE_ZOOM,
            attributionControl: { compact: true },
        });
        mapRef.current = map;

        const markers = aspirations
            .filter((aspiration) => aspiration.location)
            .map((aspiration) => {
                // Custom glowing star-dot elements tie the place map to the
                // star chart (and dodge MapLibre's light-themed popup CSS).
                const el = document.createElement('button');
                el.className = styles.placeMarker;
                el.setAttribute('aria-label', aspiration.placeName || aspiration.title);
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onSelectRef.current(aspiration);
                });
                return new maplibregl.Marker({ element: el })
                    .setLngLat([aspiration.location.lng, aspiration.location.lat])
                    .addTo(map);
            });

        // MapLibre only tracks window resizes; the card's flex layout can
        // settle (or change) after init, so track the container directly.
        const resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            markers.forEach((marker) => marker.remove());
            map.remove();
            mapRef.current = null;
        };
    }, [aspirations]);

    // Glide to the selected place when the card tours to another star.
    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        const aspiration = aspirations.find((a) => a.id === selectedId);
        if (aspiration?.location && mapRef.current) {
            mapRef.current.flyTo({
                center: [aspiration.location.lng, aspiration.location.lat],
                zoom: PLACE_ZOOM,
                duration: 1400,
            });
        }
    }, [selectedId, aspirations]);

    return <div ref={containerRef} className={styles.placeMap} />;
};

export default PlaceMap;
