export default {
    name: 'aspiration',
    title: 'Aspiration',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'category',
            title: 'Constellation',
            description:
                'By what the wish resolves to. Boundaries: if the place itself is ' +
                'the wish it is Visit, if the doing is, Experience. Media is ' +
                'on-demand and repeatable; experiences are occasions. Made by me ' +
                'is Make; obtained by me is Acquire.',
            type: 'string',
            options: {
                list: [
                    { title: 'Visit — a place', value: 'visit' },
                    { title: 'Learn — a skill / knowledge', value: 'learn' },
                    { title: 'Make — an artifact', value: 'make' },
                    { title: 'Experience — an event / action', value: 'experience' },
                    { title: 'Consume — media', value: 'consume' },
                    { title: 'Acquire — an object', value: 'acquire' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'subcategory',
            title: 'Subcategory',
            description: 'e.g. movies / shows / books / games',
            type: 'string',
            hidden: ({ document }) => document?.category !== 'consume',
        },
        {
            name: 'note',
            title: 'Why I want this',
            type: 'text',
            rows: 4,
        },
        {
            name: 'placeName',
            title: 'Place name',
            description: 'e.g. "Kyoto, Japan"',
            type: 'string',
            hidden: ({ document }) => document?.category !== 'visit',
        },
        {
            name: 'location',
            title: 'Location',
            description: 'The map in the place card opens on this point.',
            type: 'geopoint',
            hidden: ({ document }) => document?.category !== 'visit',
            // Visit stars open a card with the place on a map, so the
            // coordinates are not optional for them.
            validation: (Rule) =>
                Rule.custom((location, context) => {
                    if (context.document?.category === 'visit' && !location) {
                        return 'Visit aspirations need a location for the place map.';
                    }
                    return true;
                }),
        },
        {
            name: 'desire',
            title: 'How much I want it',
            description: '1 (someday, quietly) to 3 (burning). Drawn as the star\'s size.',
            type: 'number',
            initialValue: 2,
            validation: (Rule) => Rule.min(1).max(3).integer(),
        },
        {
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Someday', value: 'someday' },
                    { title: 'Done', value: 'done' },
                ],
                layout: 'radio',
            },
            initialValue: 'someday',
        },
        {
            name: 'completedAt',
            title: 'Completed',
            description: 'Freeform, e.g. "2025" or "March 2025".',
            type: 'string',
            hidden: ({ document }) => document?.status !== 'done',
        },
        {
            name: 'postscript',
            title: 'Postscript',
            description: 'A line about how it actually went.',
            type: 'text',
            rows: 2,
            hidden: ({ document }) => document?.status !== 'done',
        },
    ],

    orderings: [
        {
            title: 'Constellation',
            name: 'categoryAsc',
            by: [
                { field: 'category', direction: 'asc' },
                { field: 'title', direction: 'asc' },
            ],
        },
    ],

    preview: {
        select: {
            title: 'title',
            category: 'category',
            subcategory: 'subcategory',
            status: 'status',
        },
        prepare({ title, category, subcategory, status }) {
            const parts = [category, subcategory, status === 'done' ? 'done ✦' : null];
            return {
                title,
                subtitle: parts.filter(Boolean).join(' · '),
            };
        },
    },
};
