"use client";

import katex from 'katex';

// Renders raw LaTeX (without $/$$ delimiters) via KaTeX.
const Latex = ({ children, displayMode = false }) => {
    const html = katex.renderToString(children ?? '', {
        displayMode,
        throwOnError: false,
    });

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Latex;
