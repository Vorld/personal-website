"use client";

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from '../../styles/MapOfMe.module.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
// Asia-centred fallback framing, used only if no place is selected yet.
const FALLBACK_CENTER = [95, 25];
const PLACE_ZOOM = 4.5;

// Embedded in the visit note panel: opens on the selected place, shows all
// visit pins for context, and flies between them as the panel tours.
const GeoMap = ({ items, selectedId, onSelect }) => {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const firstRenderRef = useRef(true);
    // Keep the latest callback/selection without re-initialising the map.
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const initialIdRef = useRef(selectedId);

    useEffect(() => {
        const initialItem = items.find((i) => i.id === initialIdRef.current);
        const map = new maplibregl.Map({
            container: containerRef.current,
            style: STYLE_URL,
            center: initialItem?.location
                ? [initialItem.location.lng, initialItem.location.lat]
                : FALLBACK_CENTER,
            zoom: initialItem ? PLACE_ZOOM : 2.3,
            attributionControl: { compact: true },
        });
        mapRef.current = map;

        const markers = items
            .filter((item) => item.location)
            .map((item) => {
                // Custom glowing star-dot elements tie the geo map to the
                // star chart (and dodge MapLibre's light-themed popup CSS).
                const el = document.createElement('button');
                el.className = styles.geoMarker;
                el.setAttribute('aria-label', item.placeName || item.title);
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onSelectRef.current(item);
                });
                return new maplibregl.Marker({ element: el })
                    .setLngLat([item.location.lng, item.location.lat])
                    .addTo(map);
            });

        // MapLibre only tracks window resizes; the panel's flex layout can
        // settle (or change) after init, so track the container directly.
        const resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            markers.forEach((marker) => marker.remove());
            map.remove();
            mapRef.current = null;
        };
    }, [items]);

    // Glide to the selected place when the panel tours to another star.
    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        const item = items.find((i) => i.id === selectedId);
        if (item?.location && mapRef.current) {
            mapRef.current.flyTo({
                center: [item.location.lng, item.location.lat],
                zoom: PLACE_ZOOM,
                duration: 1400,
            });
        }
    }, [selectedId, items]);

    return <div ref={containerRef} className={styles.geoMap} />;
};

export default GeoMap;
