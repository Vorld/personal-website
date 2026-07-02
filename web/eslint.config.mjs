import coreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
    ...coreWebVitals,
    {
        ignores: ['.next/**', 'node_modules/**'],
    },
    {
        rules: {
            // New rule in eslint-plugin-react-hooks v7; existing animation code
            // (Typewriter) predates it. Keep as warning until refactored.
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
];

export default config;
