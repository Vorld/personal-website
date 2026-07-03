import client from '../../client';


const SITE_URL = 'https://www.venugopal.net';

export const revalidate = 0; // Ensures the sitemap is always fresh
async function getAllPostSlugs() {
  // Fetches slugs and last updated dates for all posts
  const query = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`;
  const posts = await client.fetch(query);
  return posts;
}

async function getAllCategorySlugs() {
  // Fetches slugs and last updated dates for all categories
  const query = `*[_type == "category" && defined(slug.current)]{ "slug": slug.current, _updatedAt }`;
  const categories = await client.fetch(query);
  return categories;
}

export async function GET() {
  const allPosts = await getAllPostSlugs();
  const allCategories = await getAllCategorySlugs();

  const staticPages = [
    { path: '', lastModified: new Date().toISOString(), priority: 1.0 }, // Homepage
    { path: 'blog', lastModified: new Date().toISOString(), priority: 0.8 },
    { path: 'photos', lastModified: '2024-01-01T00:00:00.000Z', priority: 0.7 }, // Updated lastModified
    { path: 'music', lastModified: '2024-01-02T00:00:00.000Z', priority: 0.7 }, // Updated lastModified
    // Add any other static pages here if needed in the future
    // e.g., { path: 'about', lastModified: new Date().toISOString(), priority: 0.5 },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
      ${staticPages
        .map((page) => {
          // Ensure path is not empty for joining with SITE_URL, or handle homepage explicitly
          const pagePath = page.path ? `/${page.path}` : '';
          return `
            <url>
              <loc>${SITE_URL}${pagePath}</loc>
              <lastmod>${page.lastModified.split('T')[0]}</lastmod>
              <priority>${page.priority}</priority>
            </url>
          `;
        })
        .join('')}
      ${allPosts
        .map((post) => {
          return `
            <url>
              <loc>${SITE_URL}/blog/${post.slug}</loc>
              <lastmod>${new Date(post._updatedAt).toISOString().split('T')[0]}</lastmod>
              <priority>0.9</priority>
            </url>
          `;
        })
        .join('')}
      ${allCategories
        .map((category) => {
          return `
            <url>
              <loc>${SITE_URL}/blog/category/${category.slug}</loc>
              <lastmod>${new Date(category._updatedAt).toISOString().split('T')[0]}</lastmod>
              <priority>0.7</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}