import groq from 'groq';
import client from '../../../client'; // urlFor removed as it's not used
import PostContent from '../../../components/PostContent';
import { notFound } from 'next/navigation';
import Script from 'next/script'; // For JSON-LD

// Helper function (you might want to move this to a utils file)
function extractTextFromPortableText(blocks = []) {
  if (!Array.isArray(blocks)) {
    return '';
  }
  return blocks
    .filter(block => block._type === 'block' && block.children)
    .map(block => block.children.filter(child => child._type === 'span').map(span => span.text).join(''))
    .join(' ')
    .substring(0, 160); // Truncate to ~160 characters for meta description
}

const SITE_URL = 'https://www.venugopal.net';

// Revalidate data every 10 seconds
export const revalidate = 10;

// Fetch data function
async function getPost(slug) {
    const query = groq`*[_type == "post" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      "authorName": author->name,
      "authorSlug": author->slug.current, // Assuming author has a slug for a potential author page
      "categories": categories[]->{title, "slug": slug.current},
      "date": publishedAt,
      _updatedAt,
      body[]{
        ...,
        _type == "file" => {
          ...,
          "originalFilename": asset->originalFilename
        }
      },
      "metaDescription": pt::text(body), // Or a dedicated metaDescription field
      'previousPost': *[_type == 'post' && publishedAt < ^.publishedAt] | order(publishedAt desc)[0].slug.current,
      'nextPost': *[_type == 'post' && publishedAt > ^.publishedAt] | order(publishedAt asc)[0].slug.current
    }`;
    const post = await client.fetch(query, { slug });
    return post;
}

// Generate static paths
export async function generateStaticParams() {
    const slugs = await client.fetch(
        groq`*[_type == "post" && defined(slug.current)][].slug.current`
    );
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for the page
export async function generateMetadata({ params }) {
    const { slug } = await params; 

    const post = await getPost(slug);
    if (!post) {
        return { 
            title: 'Post Not Found',
            description: 'The blog post you are looking for could not be found.',
        };
    }

    const postDescription = post.metaDescription || extractTextFromPortableText(post.body);

    return {
        title: post.title, // Will use template from layout.js
        description: postDescription,
        openGraph: {
            title: post.title,
            description: postDescription,
            url: `${SITE_URL}/blog/${slug}`,
            type: 'article',
            publishedTime: post.date,
            modifiedTime: post._updatedAt,
            authors: post.authorName ? [post.authorName] : [],
        },
        twitter: {
            card: 'summary', // Changed from summary_large_image
            title: post.title,
            description: postDescription,
            creator: '@_Vorld', // Optional
        },
    };
}

// Page component (Server Component)
const PostPage = async ({ params }) => {
    const { slug } = await params;
    const post = await getPost(slug);

    if (!post) {
        notFound();
    }

    const postDescription = post.metaDescription || extractTextFromPortableText(post.body);
    // imageUrl related lines removed

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article', // Or BlogPosting
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${slug}`,
        },
        headline: post.title,
        description: postDescription,
        author: {
            '@type': 'Person',
            name: post.authorName || 'Kulkarni Venugopal', // Fallback author name
            // url: post.authorSlug ? `${SITE_URL}/author/${post.authorSlug}` : undefined, // If you have author pages
        },
        publisher: {
            '@type': 'Organization',
            name: 'Kulkarni Venugopal',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/myPhoto.jpg`, // Ensure this logo exists
            },
        },
        datePublished: post.date,
        dateModified: post._updatedAt,
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: `${SITE_URL}/blog`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: post.title,
            },
        ],
    };

    return (
        <>
            <Script
                id="article-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <PostContent post={post} />
        </>
    );
};

export default PostPage;
