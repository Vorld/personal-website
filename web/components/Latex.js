import katex from 'katex';

// Renders raw LaTeX (without $/$$ delimiters) via KaTeX. Pure string
// rendering, so it runs on the server and KaTeX never ships to the client.
const Latex = ({ children, displayMode = false }) => {
    const html = katex.renderToString(children ?? '', {
        displayMode,
        throwOnError: false,
    });

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Latex;
