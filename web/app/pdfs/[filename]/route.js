import client from '../../../client';

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
    const upstream = await fetch(
        `https://cdn.sanity.io/files/${projectId}/${dataset}/${filename}`
    );
    if (!upstream.ok) {
        return new Response('Not found', { status: 404 });
    }

    return new Response(upstream.body, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            // Sanity file URLs are content-addressed, so the bytes never change
            'Cache-Control': 'public, max-age=31536000, immutable',
            // The Adobe viewer fetches the PDF from its own iframe origin
            'Access-Control-Allow-Origin': '*',
        },
    });
}
