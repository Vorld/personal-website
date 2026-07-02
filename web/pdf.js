const SANITY_PROJECT_ID = 'qjy3hvt5';
const SANITY_DATASET = 'production';

export function pdfUrlFromAssetRef(assetRef) {
    if (!assetRef) {
        return null;
    }

    const parts = assetRef.split('-');
    if (parts[0] !== 'file' || parts.length < 3) {
        return null;
    }

    const extension = parts.at(-1);
    const id = parts.slice(1, -1).join('-');

    return `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}.${extension}`;
}

export function pdfPagePath(postSlug, pdfKey) {
    if (!postSlug || !pdfKey) {
        return null;
    }

    return `/blog/${encodeURIComponent(postSlug)}/pdf/${encodeURIComponent(pdfKey)}`;
}
