import groq from 'groq';
import client from '../../client';

const SITE_URL = 'https://www.venugopal.net';

export const revalidate = 3600; // Regenerate at most hourly

function escapeXml(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function getPosts() {
    const query = groq`*[_type == "post" && publishedAt < now() && defined(slug.current)]
        | order(publishedAt desc)[0...50]{
            title,
            subtitle,
            "slug": slug.current,
            publishedAt,
            "categories": categories[]->title,
            "excerpt": pt::text(body)
        }`;
    return client.fetch(query);
}

export async function GET() {
    const posts = await getPosts();

    const items = posts
        .map((post) => {
            const url = `${SITE_URL}/blog/${post.slug}`;
            const description = post.subtitle || (post.excerpt || '').substring(0, 300);
            const categories = (post.categories || [])
                .map((title) => `<category>${escapeXml(title)}</category>`)
                .join('');
            return `        <item>
            <title>${escapeXml(post.title)}</title>
            <link>${url}</link>
            <guid isPermaLink="true">${url}</guid>
            <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
            <description>${escapeXml(description)}</description>
            ${categories}
        </item>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Kulkarni Venugopal</title>
        <link>${SITE_URL}</link>
        <description>Kulkarni Venugopal's Personal Website and Blog</description>
        <language>en</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
    </channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
        },
    });
}
