import groq from 'groq';
import client from '../../client';
import Header from '../../components/Header';
import StarChart from '../../components/starchart/StarChart';
import AspirationList from '../../components/AspirationList';
import sampleAspirations from '../../data/sampleAspirations';

// Fetch data at the server level
async function getAspirations() {
    const aspirations = await client.fetch(groq`*[_type == "aspiration"]
        | order(category asc, coalesce(order, 999) asc, title asc) {
        "id": _id,
        title,
        category,
        subcategory,
        note,
        placeName,
        "location": location{ lat, lng },
        "prominence": coalesce(prominence, 2),
        status,
        completedAt,
        postscript
    }`);
    // Until real aspiration docs exist in Sanity, keep showing the sample
    // sky rather than an empty one. Delete this (and data/sampleAspirations)
    // once the content is in.
    return aspirations?.length ? aspirations : sampleAspirations;
}

export const metadata = {
    title: 'Map of Me',
    description: 'A star chart of things I want to see, learn, make, and do.',
};

// Revalidate data every 10 seconds
export const revalidate = 10;

const MapPage = async () => {
    const aspirations = await getAspirations();

    return (
        <div>
            <Header heading={'MAP OF ME'} />
            <StarChart items={aspirations} />
            <AspirationList items={aspirations} />
        </div>
    );
};

export default MapPage;
