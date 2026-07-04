import groq from 'groq';
import client from '../../client';
import Header from '../../components/Header';
import StarChart from '../../components/StarChart/StarChart';
import AspirationList from '../../components/AspirationList';

// Fetch data at the server level
async function getAspirations() {
    const [aspirations, galleryImages] = await Promise.all([
        client.fetch(groq`*[_type == "aspiration"]
            | order(category asc, title asc) {
            "id": _id,
            title,
            category,
            subcategory,
            note,
            "noteText": pt::text(note),
            "image": image{ "ref": asset._ref, "url": asset->url },
            placeName,
            "location": location{ lat, lng },
            "desire": coalesce(desire, 2),
            done,
            completedAt,
            postscript,
            "postscriptText": pt::text(postscript)
        }`),
        client.fetch(groq`*[_type == "gallery"][0].images[]{ _key, "ref": asset._ref }`),
    ]);

    // A card image that also lives in the photo gallery links to that
    // photo's lightbox permalink (/photos?photo=<key>).
    const keyByRef = new Map((galleryImages || []).map((img) => [img.ref, img._key]));
    return (aspirations || []).map((aspiration) =>
        aspiration.image?.ref && keyByRef.has(aspiration.image.ref)
            ? { ...aspiration, photoKey: keyByRef.get(aspiration.image.ref) }
            : aspiration
    );
}

export const metadata = {
    title: 'Map',
    description: 'A map of the things I want to see, learn, make, and do.',
};

// Revalidate data every 10 seconds
export const revalidate = 10;

const MapPage = async () => {
    const aspirations = await getAspirations();

    return (
        <div>
            <Header heading={'MAP'} />
            <StarChart aspirations={aspirations} />
            <AspirationList aspirations={aspirations} />
        </div>
    );
};

export default MapPage;
