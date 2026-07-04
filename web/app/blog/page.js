import groq from 'groq';
import client from '../../client';
import Header from '../../components/Header';
// Remove unused Link and FormattedDate imports from here
import PostPreviewList from '../../components/PostPreviewList'; // Import the new client component
import styles from '../../styles/Blog.module.css'; // Keep if needed for other elements

// Fetch data at the server level
async function getPosts() {
    const posts = await client.fetch(groq`
      *[_type == "post" && publishedAt < now()]{ 
        _id,
        title,
        subtitle, 
        "author": author->name,
        slug,
        publishedAt,
        "categories": categories[]->{title, slug},
    } | order(publishedAt desc)
    `);
    return posts;
}

// Define metadata for this page
export const metadata = {
  title: 'Blog',
};

// Revalidate data every 10 seconds
export const revalidate = 10;

// Blog Page Component (Server Component)
const BlogPage = async () => {
    const posts = await getPosts();

    return (
        <div>
            <Header heading={'BLOG'} />
            {/* Render the client component to display the list */}
            <PostPreviewList posts={posts} />
        </div>
    );
};

export default BlogPage;
