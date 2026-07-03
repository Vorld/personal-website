// Sample aspiration data for the /map prototype.
// Mirrors the shape the future Sanity `aspiration` GROQ query will return,
// so swapping in the CMS later is a one-line change in app/map/page.js.
// Edit freely — titles and notes here are placeholders to make the
// prototype feel real.

const sampleAspirations = [
    // VISIT — places, with { lat, lng } for the geo map later
    {
        id: 'visit-kyoto',
        title: 'Kyoto',
        category: 'visit',
        note: 'Temples in the morning, jazz kissa listening bars at night. Two of my favourite things in one city.',
        placeName: 'Kyoto, Japan',
        location: { lat: 35.0116, lng: 135.7681 },
        prominence: 3,
    },
    {
        id: 'visit-xian',
        title: "Xi'an",
        category: 'visit',
        note: 'Where the Silk Road began. Also the best possible excuse to finally use my Mandarin outside a textbook.',
        placeName: "Xi'an, China",
        location: { lat: 34.3416, lng: 108.9398 },
        prominence: 2,
    },
    {
        id: 'visit-samarkand',
        title: 'Samarkand',
        category: 'visit',
        note: 'Registan at dusk. Some places feel like they belong to stories more than to maps.',
        placeName: 'Samarkand, Uzbekistan',
        location: { lat: 39.627, lng: 66.975 },
        prominence: 2,
    },
    {
        id: 'visit-istanbul',
        title: 'Istanbul',
        category: 'visit',
        note: 'A city that has been the centre of the world more than once. I want to stand where the continents meet.',
        placeName: 'Istanbul, Türkiye',
        location: { lat: 41.0082, lng: 28.9784 },
        prominence: 2,
    },
    {
        id: 'visit-neworleans',
        title: 'New Orleans',
        category: 'visit',
        note: 'Pilgrimage. You can learn jazz anywhere, but it was born here.',
        placeName: 'New Orleans, USA',
        location: { lat: 29.9511, lng: -90.0715 },
        prominence: 3,
    },
    {
        id: 'visit-hampi',
        title: 'Hampi',
        category: 'visit',
        note: 'An empire turned to boulders. Closer to home than I have any excuse for.',
        placeName: 'Hampi, India',
        location: { lat: 15.335, lng: 76.46 },
        prominence: 1,
    },

    // LEARN
    {
        id: 'learn-jazz',
        title: 'Jazz',
        category: 'learn',
        note: 'To sit down at any piano and improvise over a standard without thinking about it. The long game.',
        prominence: 3,
    },
    {
        id: 'learn-chinese',
        title: 'Chinese',
        category: 'learn',
        note: 'Hold a real conversation in Mandarin — not survival phrases, an actual conversation with wandering tangents.',
        prominence: 3,
    },

    // MAKE
    {
        id: 'make-software',
        title: 'Software',
        category: 'make',
        note: 'Small tools that people actually use. This website is one attempt.',
        prominence: 3,
    },
    {
        id: 'make-music',
        title: 'Music',
        category: 'make',
        note: 'Finish and release a small EP instead of hoarding half-finished project files.',
        prominence: 2,
    },
    {
        id: 'make-writing',
        title: 'Writing',
        category: 'make',
        note: 'Essays and poems. Writing is how I find out what I actually think.',
        prominence: 2,
    },

    // CONSUME — subcategory splits into movies / shows / books / games
    {
        id: 'consume-mood-for-love',
        title: 'In the Mood for Love',
        category: 'consume',
        subcategory: 'movies',
        note: 'Everyone I trust about film goes quiet and reverent when this comes up. I want to know why.',
        prominence: 2,
    },
    {
        id: 'consume-the-wire',
        title: 'The Wire',
        category: 'consume',
        subcategory: 'shows',
        note: 'The show every other show gets measured against. Time to stop nodding along in conversations.',
        prominence: 1,
    },
    {
        id: 'consume-karamazov',
        title: 'The Brothers Karamazov',
        category: 'consume',
        subcategory: 'books',
        note: 'The big one. I want a winter and a good armchair for it.',
        prominence: 2,
    },
    {
        id: 'consume-outer-wilds',
        title: 'Outer Wilds',
        category: 'consume',
        subcategory: 'games',
        note: 'A game about exploring a hand-crafted solar system, best played knowing nothing. Fitting for this page.',
        prominence: 2,
    },

    // DO
    {
        id: 'do-poetry-open-mic',
        title: 'Poetry open mic',
        category: 'do',
        note: 'Read something I wrote to a room of strangers. Terrifying in the useful way.',
        prominence: 2,
    },
    {
        id: 'do-jazz-jam',
        title: 'Jazz jam session',
        category: 'do',
        note: 'Sit in on a jam and survive the changes. See: learning jazz.',
        prominence: 2,
    },

    // GET
    {
        id: 'get-asia-map',
        title: 'Asia-centred map',
        category: 'get',
        note: 'A wall map with Asia in the middle for once. The Atlantic has had a long enough run.',
        prominence: 2,
    },
    {
        id: 'get-celestial-sphere',
        title: 'Celestial sphere',
        category: 'get',
        note: 'A globe of the sky itself. The object this whole page is secretly imitating.',
        prominence: 3,
    },
];

export default sampleAspirations;
