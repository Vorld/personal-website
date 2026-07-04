import Header from '../../components/Header';

// Define metadata for this page
export const metadata = {
  title: 'Music',
};

// Music Page Component (Server Component)
const MusicPage = () => {
    return (
        <div>
            <Header heading={'MUSIC'} />
            {/* Add music content here */}
        </div>
    );
};

export default MusicPage;
