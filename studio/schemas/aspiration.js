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
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Visit', value: 'visit' },
                    { title: 'Learn', value: 'learn' },
                    { title: 'Make', value: 'make' },
                    { title: 'Experience', value: 'experience' },
                    { title: 'Consume', value: 'consume' },
                    { title: 'Acquire', value: 'acquire' },
                ],
                layout: 'radio',
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'subcategory',
            title: 'Subcategory',
            type: 'string',
            options: {
                list: [
                    { title: 'Movies', value: 'movies' },
                    { title: 'Shows', value: 'shows' },
                    { title: 'Books', value: 'books' },
                    { title: 'Games', value: 'games' },
                ],
                layout: 'radio',
            },
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
            type: 'string',
            hidden: ({ document }) => document?.category !== 'visit',
        },
        {
            name: 'location',
            title: 'Location',
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
            title: 'Desire',
            description: 'How much I want it, 1–3. Drawn as the star\'s size.',
            type: 'number',
            initialValue: 2,
            validation: (Rule) => Rule.min(1).max(3).integer(),
        },
        {
            name: 'done',
            title: 'Done',
            type: 'boolean',
            initialValue: false,
        },
        {
            name: 'completedAt',
            title: 'Completed at',
            type: 'date',
            hidden: ({ document }) => !document?.done,
        },
        {
            name: 'postscript',
            title: 'Postscript',
            description: 'A line about how it actually went.',
            type: 'text',
            rows: 2,
            hidden: ({ document }) => !document?.done,
        },
    ],

    orderings: [
        {
            title: 'Category',
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
            done: 'done',
        },
        prepare({ title, category, subcategory, done }) {
            const parts = [category, subcategory, done ? 'done ✦' : null];
            return {
                title,
                subtitle: parts.filter(Boolean).join(' · '),
            };
        },
    },
};
