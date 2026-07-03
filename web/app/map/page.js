import Header from '../../components/Header';
import StarChart from '../../components/starchart/StarChart';
import sampleAspirations from '../../data/sampleAspirations';

// Prototype: reads hardcoded sample data. Will be swapped for a Sanity
// GROQ fetch (with revalidate) once the chart itself is settled.
function getAspirations() {
    return sampleAspirations;
}

export const metadata = {
    title: 'Map of Me',
    description: 'A star chart of things I want to see, learn, make, and do.',
};

const MapPage = () => {
    const aspirations = getAspirations();

    return (
        <div>
            <Header heading={'MAP OF ME'} />
            <StarChart items={aspirations} />
        </div>
    );
};

export default MapPage;
