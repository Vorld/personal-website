import { cache } from 'react';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFParse } from 'pdf-parse';

const pdfWorkerPath = path.join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.mjs'
);

PDFParse.setWorker(pathToFileURL(pdfWorkerPath).toString());

function normalizePdfText(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export const extractPdfText = cache(async (pdfUrl) => {
    if (!pdfUrl) {
        return '';
    }

    let parser;

    try {
        parser = new PDFParse({ url: pdfUrl });
        const result = await parser.getText();
        return normalizePdfText(result.text);
    } catch (error) {
        console.warn(`Unable to extract PDF text from ${pdfUrl}`, error);
        return '';
    } finally {
        if (parser) {
            await parser.destroy().catch(() => {});
        }
    }
});
