export default {
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: { type: 'author' },
        },
        {
            name: 'categories',
            title: 'Categories',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'category' } }],
        },
        {
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
            validation: (Rule) => Rule.required(),
        },
        {
            name: 'body',
            title: 'Body',
            type: 'blockContent',
        },
    ],

    orderings: [
        {
            title: 'Published date, newest first',
            name: 'publishedAtDesc',
            by: [{ field: 'publishedAt', direction: 'desc' }],
        },
    ],

    preview: {
        select: {
            title: 'title',
            subtitle: 'subtitle',
            date: 'publishedAt',
        },
        prepare({ title, subtitle, date }) {
            const formattedDate = date
                ? new Date(date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                  })
                : 'No publish date';
            return {
                title,
                subtitle: subtitle ? `${formattedDate} — ${subtitle}` : formattedDate,
            };
        },
    },
};
