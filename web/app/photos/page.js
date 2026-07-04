import groq from 'groq';
import client from '../../client';
import Header from '../../components/Header';
import PhotoGallery from '../../components/PhotoGallery'; 

// Fetch data at the server level
async function getImages() {
    const gallery = await client.fetch(groq`*[_type == "gallery"][0]{
        "images": images[]{
            "id": _key,
            "alt": asset->alt,
            "caption": caption,
            "url": asset->url,
            "dimensions": asset->metadata.dimensions
        }
    }`);
    return gallery?.images?.filter(Boolean) || [];
}

// Define metadata for this page
export const metadata = {
  title: 'Photos',
};

// Revalidate data every 10 seconds
export const revalidate = 10;

// Photos Page Component (Server Component)
const PhotosPage = async () => {
    const images = await getImages();

    return (
        <div>
            <Header heading={'PHOTOS'} />
            <PhotoGallery images={images} />
        </div>
    );
};

export default PhotosPage;
