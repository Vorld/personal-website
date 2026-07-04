import blockContent from './blockContent';
import category from './category';
import post from './post';
import author from './author';
import galleryImage from './galleryImage';
import aspiration from './aspiration';
import poetry from './objects/poetry';

// Then we give our schema to the builder and provide the result to Sanity
export default [
    // The following are document types which will appear
    // in the studio.
    post,
    author,
    category,
    galleryImage,
    aspiration,
    // When added to this list, object types can be used as
    // { type: 'typename' } in other document schemas
    blockContent,
    poetry,
];
