import groq from 'groq';
import client from '../../../client';

const SITE_URL = 'https://www.venugopal.net';

// PDFs live on the Sanity CDN, whose robots.txt blocks crawlers from *.pdf.
// Serving them from our own domain lets search engines index their contents
// and attribute them to this site.
export async function GET(request, { params }) {
    const { filename } = await params;

    // Asset filenames are "<hash>.pdf"; reject anything else so this route
    // doesn't become an open proxy for the whole Sanity project
    if (!/^[a-z0-9]+\.pdf$/i.test(filename)) {
        return new Response('Not found', { status: 404 });
    }

    const { projectId, dataset } = client.config();
    const [upstream, postSlug] = await Promise.all([
        fetch(`https://cdn.sanity.io/files/${projectId}/${dataset}/${filename}`),
        client.fetch(
            groq`*[_type == "post" && $ref in body[_type == "file"].asset._ref][0].slug.current`,
            { ref: `file-${filename.replace('.', '-')}` }
        ),
    ]);
    if (!upstream.ok) {
        return new Response('Not found', { status: 404 });
    }

    const headers = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        // Sanity file URLs are content-addressed, so the bytes never change
        'Cache-Control': 'public, max-age=31536000, immutable',
        // The Adobe viewer fetches the PDF from its own iframe origin
        'Access-Control-Allow-Origin': '*',
    };
    // Ask search engines to consolidate the PDF's ranking signals into the
    // blog post that embeds it, so searches land on the post instead
    if (postSlug) {
        headers['Link'] = `<${SITE_URL}/blog/${postSlug}>; rel="canonical"`;
    }

    return new Response(upstream.body, { headers });
}
