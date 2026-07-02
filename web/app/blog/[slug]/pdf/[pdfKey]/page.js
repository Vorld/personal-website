import groq from 'groq';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import client from '../../../../../client';
import FormattedDate from '../../../../../components/FormattedDate';
import Header from '../../../../../components/Header';
import PDFViewer from '../../../../../components/PDFViewer/PDFViewer';
import { pdfPagePath, pdfUrlFromAssetRef } from '../../../../../pdf';
import styles from '../../../../../styles/Post.module.css';

const SITE_URL = 'https://www.venugopal.net';

export const revalidate = 10;

function textExcerpt(text = '', maxLength = 160) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function getPdfTitle(post, pdf) {
    return pdf?.title || pdf?.originalFilename || `${post.title} PDF`;
}

async function getPdfPage(slug, pdfKey) {
    const query = groq`*[_type == "post" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      "authorName": author->name,
      "date": publishedAt,
      _updatedAt,
      "pdf": body[_type == "file" && _key == $pdfKey][0]{
        _key,
        title,
        description,
        transcript,
        "assetRef": asset._ref,
        "originalFilename": asset->originalFilename
      }
    }`;
    return client.fetch(query, { slug, pdfKey });
}

export async function generateStaticParams() {
    const posts = await client.fetch(
        groq`*[_type == "post" && defined(slug.current)]{
          "slug": slug.current,
          "pdfKeys": body[_type == "file" && defined(asset._ref)]._key
        }`
    );

    return posts.flatMap((post) =>
        (post.pdfKeys || []).map((pdfKey) => ({
            slug: post.slug,
            pdfKey,
        }))
    );
}

export async function generateMetadata({ params }) {
    const { slug, pdfKey } = await params;
    const post = await getPdfPage(slug, pdfKey);

    if (!post?.pdf?.assetRef) {
        return {
            title: 'PDF Not Found',
            description: 'The PDF document you are looking for could not be found.',
        };
    }

    const title = getPdfTitle(post, post.pdf);
    const description =
        post.pdf.description ||
        textExcerpt(post.pdf.transcript) ||
        `PDF document from ${post.title}.`;
    const canonicalPath = pdfPagePath(slug, pdfKey);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    return {
        title: `${title} | ${post.title}`,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: 'article',
            publishedTime: post.date,
            modifiedTime: post._updatedAt,
            authors: post.authorName ? [post.authorName] : [],
        },
        twitter: {
            card: 'summary',
            title,
            description,
            creator: '@_Vorld',
        },
    };
}

const PdfPage = async ({ params }) => {
    const { slug, pdfKey } = await params;
    const post = await getPdfPage(slug, pdfKey);

    if (!post?.pdf?.assetRef) {
        notFound();
    }

    const pdfUrl = pdfUrlFromAssetRef(post.pdf.assetRef);
    if (!pdfUrl) {
        notFound();
    }

    const pdfTitle = getPdfTitle(post, post.pdf);
    const description =
        post.pdf.description ||
        textExcerpt(post.pdf.transcript) ||
        `PDF document from ${post.title}.`;
    const pagePath = pdfPagePath(slug, pdfKey);
    const pageUrl = `${SITE_URL}${pagePath}`;
    const postUrl = `${SITE_URL}/blog/${slug}`;
    const pdfSchema = {
        '@context': 'https://schema.org',
        '@type': 'DigitalDocument',
        name: pdfTitle,
        description,
        url: pageUrl,
        encodingFormat: 'application/pdf',
        isPartOf: {
            '@type': 'BlogPosting',
            headline: post.title,
            url: postUrl,
        },
        associatedMedia: {
            '@type': 'MediaObject',
            contentUrl: pdfUrl,
            encodingFormat: 'application/pdf',
        },
        datePublished: post.date,
        dateModified: post._updatedAt,
    };

    return (
        <>
            <Script
                id="pdf-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(pdfSchema) }}
            />
            <Header heading={'PDF'} />

            <article className={styles.container}>
                <Link href={`/blog/${slug}`} className={styles.return}>
                    Back to post
                </Link>
                <h1 className={styles.title}>{pdfTitle}</h1>
                <h5 className={styles.name}>From {post.title}</h5>
                <span className={styles.date}>
                    <FormattedDate date={post.date} />
                </span>

                {post.pdf.description && (
                    <p className={styles.pdfDescription}>{post.pdf.description}</p>
                )}

                <div className={styles.pdfActions}>
                    <a href={pdfUrl} className={styles.pdfAction}>
                        Download original PDF
                    </a>
                    <Link href={`/blog/${slug}`} className={styles.pdfAction}>
                        Read the post
                    </Link>
                </div>

                <PDFViewer url={pdfUrl} id={`pdf-${pdfKey}`} />

                {post.pdf.transcript && (
                    <section className={styles.pdfTranscript}>
                        <h2>Text version</h2>
                        <div className={styles.pdfTranscriptText}>
                            {post.pdf.transcript}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
};

export default PdfPage;
