// Sanity file asset refs look like "file-<hash>-pdf". PDFs are served
// through /pdfs/[filename] so crawlers index them under our domain instead
// of cdn.sanity.io, whose robots.txt disallows *.pdf.
export function pdfPathFromRef(ref) {
    const [, id, extension] = ref.split('-');
    return `/pdfs/${id}.${extension}`;
}
