import groq from 'groq';
import client from '../../client';
import Header from '../../components/Header';
import StarChart from '../../components/starchart/StarChart';
import AspirationList from '../../components/AspirationList';

// Fetch data at the server level
async function getAspirations() {
    const aspirations = await client.fetch(groq`*[_type == "aspiration"]
        | order(category asc, title asc) {
        "id": _id,
        title,
        category,
        subcategory,
        note,
        placeName,
        "location": location{ lat, lng },
        "desire": coalesce(desire, 2),
        status,
        completedAt,
        postscript
    }`);
    return aspirations || [];
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
            <StarChart items={aspirations} />
            <AspirationList items={aspirations} />
        </div>
    );
};

export default MapPage;
