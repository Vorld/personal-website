"use client"; // PortableText needs to be a client component if using custom client components like Latex or PDFViewer

import styles from '../styles/Post.module.css'; // Corrected path
import client from '../client'; // Corrected path
import { createImageUrlBuilder } from '@sanity/image-url';
import { getImageDimensions } from '@sanity/asset-utils';
import { PortableText as ReactPortableText } from '@portabletext/react'; // Rename to avoid conflict
import 'katex/dist/katex.min.css';
import Latex from './Latex'; // Needs to be client-side
import Link from 'next/link';
import Image from 'next/image';
import Header from './Header'; // Corrected path
import FormattedDate from './FormattedDate'; // Corrected path
import PDFViewer from './PDFViewer/PDFViewer'; // Corrected path
import CodeBlock from './CodeBlock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

// Image build for portable text
function urlFor(source) {
    return createImageUrlBuilder(client).image(source);
}

// Stable anchor ids for headings, derived from their text
function headingId(value) {
    const text = value.children?.map((child) => child.text ?? '').join('') ?? '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
}

const heading = (Tag) => {
    const Heading = ({ children, value }) => <Tag id={headingId(value)}>{children}</Tag>;
    Heading.displayName = `Heading(${Tag})`;
    return Heading;
};

// All custom ptComponents
const ptComponents = {
    block: {
        h1: heading('h1'),
        h2: heading('h2'),
        h3: heading('h3'),
        h4: heading('h4'),
    },
    types: {
        image: ({ value }) => {
            if (!value?.asset?._ref) {
                return null;
            }
            // Real dimensions are encoded in the asset ref, so Next.js
            // can reserve the correct aspect ratio before the image loads
            let width, height;
            try {
                ({ width, height } = getImageDimensions(value));
            } catch {
                return null; // malformed asset ref; skip rather than crash the post
            }
            return (
                <figure className={styles.figure}>
                    <Image
                        alt={value.alt || value.caption || ''}
                        loading='lazy'
                        src={urlFor(value).width(1200).fit('max').auto('format').url()}
                        width={width}
                        height={height}
                        sizes="(max-width: 767px) 75vw, 50vw"
                        style={{ width: '100%', height: 'auto' }}
                    />
                    {value.caption && (
                        <figcaption className={styles.caption}>{value.caption}</figcaption>
                    )}
                </figure>
            );
        },
        code: ({ value }) => <CodeBlock value={value} />,
        // Latex component needs to run client-side
        latex: ({ value, isInline }) => {
            return <Latex displayMode={!isInline}>{value.body}</Latex>;
        },
        poetry: ({ value }) => {
            // Simple div, can remain server-side if PortableText is structured carefully
            // But since Latex/PDFViewer force client-side, this is fine here.
            return <div className={styles.poem}>{value.poem}</div>;
        },
        // PDFViewer is a client component
        file: ({ value }) => {
            if (!value?.asset?._ref) return null;
            const { _ref } = value.asset;
            const [_file, id, extension] = _ref.split('-');
            const url =
                'https://cdn.sanity.io/files/qjy3hvt5/production/' +
                id +
                '.' +
                extension;

            return (
                <>
                    {/* PDF URL link for SEO - hidden from view but in DOM */}
                    <a
                        href={url}
                        aria-label="Download PDF document"
                        style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: '-1px',
                            overflow: 'hidden',
                            clip: 'rect(0,0,0,0)',
                            whiteSpace: 'nowrap',
                            border: 0
                        }}
                    >
                        View PDF Document
                    </a>
                    <PDFViewer url={url} id={id} />
                </>
            );
        },
    },
};


const PostContent = ({ post }) => {
    if (!post) {
        return null;
    }

    const {
        title = 'Missing title',
        authorName = 'Missing author name',
        categories,
        date,
        body = [],
        previousPost,
        nextPost,
    } = post;

    return (
        <div>
            <Header heading={'BLOG'} />

            <article className={styles.container}>
                <Link href='/blog' className={styles.return}>
                    <FontAwesomeIcon icon={faAngleLeft} />
                    {' Back to all'}
                </Link>
                <h1 className={styles.title}>{title}</h1>
                <h5 className={styles.name}>By {authorName}</h5>
                <span className={styles.date}>
                    <FormattedDate date={date} />
                </span>

                <div className={styles.body}>
                    <ReactPortableText value={body} components={ptComponents} />
                </div>

                <span className={styles.categories}>
                    {categories?.map((category) => (
                        <Link
                            key={category.title}
                            href={`/blog/category/${category.slug}`}
                        >
                            {category.title}
                        </Link>
                    ))}
                </span>
            </article>

            <div className={styles['nav-buttons']}>
                {previousPost ? (
                    <Link
                        href={`/blog/${previousPost}`}
                        className={styles['nav-button']}
                    >
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </Link>
                ) : (
                    <div></div> // Keep div for layout consistency
                )}
                {nextPost ? (
                    <Link href={`/blog/${nextPost}`} className={styles['nav-button']}>
                        <FontAwesomeIcon icon={faAngleRight} />
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

export default PostContent;
