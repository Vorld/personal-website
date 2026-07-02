"use client";

import { useState } from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from '../styles/components/CodeBlock.module.css';

const CodeBlock = ({ value }) => {
    const [copied, setCopied] = useState(false);
    const { code, language, filename } = value || {};

    if (!code) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (e.g. insecure context); button just does nothing
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>{filename || language || 'code'}</span>
                <button
                    type="button"
                    className={styles.copy}
                    onClick={handleCopy}
                    aria-label="Copy code to clipboard"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 4px 4px',
                    background: '#1e1e1e',
                    fontSize: '0.9em',
                }}
                showLineNumbers={false}
                wrapLongLines={false}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock;
