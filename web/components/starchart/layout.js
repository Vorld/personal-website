// Pure layout math for the star chart — no React.
// Positions are derived deterministically from item ids, so adding an
// aspiration in the data (later: in Sanity) makes a star appear in a stable
// spot with no authored coordinates.

export const WORLD = { width: 3000, height: 2000 };

// Irregular anchor placement so the sky reads as constellations, not a grid.
export const CATEGORIES = [
    { key: 'visit', label: 'VISIT', anchor: { x: 750, y: 550 } },
    { key: 'learn', label: 'LEARN', anchor: { x: 1900, y: 400 } },
    { key: 'make', label: 'MAKE', anchor: { x: 2450, y: 1000 } },
    { key: 'do', label: 'DO', anchor: { x: 600, y: 1450 } },
    { key: 'consume', label: 'CONSUME', anchor: { x: 1500, y: 1150 } },
    { key: 'get', label: 'GET', anchor: { x: 2300, y: 1650 } },
];

// djb2
export function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const MIN_STAR_DISTANCE = 70;

// Push apart same-constellation stars that landed too close.
// Fixed pass count and iteration order keep it deterministic.
function relax(stars) {
    for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[j].x - stars[i].x;
                const dy = stars[j].y - stars[i].y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist < MIN_STAR_DISTANCE) {
                    const push = (MIN_STAR_DISTANCE - dist) / 2;
                    const ux = dx / dist;
                    const uy = dy / dist;
                    stars[i].x -= ux * push;
                    stars[i].y -= uy * push;
                    stars[j].x += ux * push;
                    stars[j].y += uy * push;
                }
            }
        }
    }
}

// Greedy nearest-neighbour chain starting from the star closest to the
// anchor — produces a plausible constellation polyline.
function chainEdges(stars, anchor) {
    if (stars.length < 2) return [];
    const unvisited = stars.map((_, i) => i);
    let currentIdx = 0;
    let best = Infinity;
    unvisited.forEach((i) => {
        const d = Math.hypot(stars[i].x - anchor.x, stars[i].y - anchor.y);
        if (d < best) {
            best = d;
            currentIdx = i;
        }
    });

    const edges = [];
    let current = currentIdx;
    unvisited.splice(unvisited.indexOf(current), 1);
    while (unvisited.length > 0) {
        let nearest = unvisited[0];
        let nearestDist = Infinity;
        unvisited.forEach((i) => {
            const d = Math.hypot(stars[i].x - stars[current].x, stars[i].y - stars[current].y);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = i;
            }
        });
        edges.push([current, nearest]);
        current = nearest;
        unvisited.splice(unvisited.indexOf(current), 1);
    }
    return edges;
}

// Connect consume items in subcategory order so movies sit next to movies
// on the line, etc.
function sequentialEdges(stars) {
    const edges = [];
    for (let i = 0; i < stars.length - 1; i++) {
        edges.push([i, i + 1]);
    }
    return edges;
}

export function computeLayout(items) {
    return CATEGORIES.map((cat) => {
        let group = items.filter((item) => item.category === cat.key);
        if (cat.key === 'consume') {
            group = [...group].sort((a, b) =>
                `${a.subcategory || ''}${a.id}`.localeCompare(`${b.subcategory || ''}${b.id}`)
            );
        } else {
            group = [...group].sort((a, b) => a.id.localeCompare(b.id));
        }

        const stars = group.map((item) => {
            const rand = mulberry32(hashString(item.id));
            const angle = rand() * Math.PI * 2;
            const dist = 70 + rand() * 180;
            return {
                item,
                x: cat.anchor.x + Math.cos(angle) * dist,
                y: cat.anchor.y + Math.sin(angle) * dist,
                r: 2 + (item.prominence || 1) * 1.5,
            };
        });
        relax(stars);

        const edges =
            cat.key === 'consume' ? sequentialEdges(stars) : chainEdges(stars, cat.anchor);

        return { ...cat, stars, edges };
    });
}

// Decorative background stars from a constant seed — same sky every visit.
// Three depth layers, all behind the constellations, each panning at a
// different fraction of the camera speed (see DUST_LAYERS in StarChart).
// The constellation plane itself carries no dust — only real aspirations.
// Dust extends past the world edges so parallax shift and edge overscroll
// never reveal a bare border.
const DUST_MARGIN = 600;

export function computeDust() {
    const rand = mulberry32(20260703);
    const layer = (name, count, rMin, rSpread, oMin, oSpread) => {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                id: `${name}-${i}`,
                x: -DUST_MARGIN + rand() * (WORLD.width + 2 * DUST_MARGIN),
                y: -DUST_MARGIN + rand() * (WORLD.height + 2 * DUST_MARGIN),
                r: rMin + rand() * rSpread,
                opacity: oMin + rand() * oSpread,
                twinkle: rand() < 0.45,
                duration: 3 + rand() * 4,
                delay: rand() * 6,
            });
        }
        return stars;
    };
    return {
        deep: layer('deep', 220, 0.4, 0.5, 0.06, 0.1),
        mid: layer('mid', 160, 0.6, 0.6, 0.1, 0.12),
        close: layer('close', 100, 0.8, 0.9, 0.14, 0.14),
    };
}
