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
// Two depth layers: "far" pans slower than the camera (parallax), "near"
// moves with the world.
export function computeDust() {
    const rand = mulberry32(20260703);
    const far = [];
    for (let i = 0; i < 90; i++) {
        far.push({
            id: `far-${i}`,
            x: rand() * WORLD.width,
            y: rand() * WORLD.height,
            r: 0.4 + rand() * 0.7,
            opacity: 0.06 + rand() * 0.14,
        });
    }
    const near = [];
    for (let i = 0; i < 70; i++) {
        near.push({
            id: `near-${i}`,
            x: rand() * WORLD.width,
            y: rand() * WORLD.height,
            r: 0.8 + rand() * 1.1,
            opacity: 0.15 + rand() * 0.25,
        });
    }
    return { far, near };
}
