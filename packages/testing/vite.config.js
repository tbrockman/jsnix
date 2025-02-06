import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: '.', // Set the e2e folder as the root
    server: {
        port: 3001,
        fs: {
            // Allow access to the root of the monorepo
            allow: ['../../'],
        },
    },
    resolve: {
        alias: {
            // Resolve `node_modules` correctly
            '@jsnix/xterm': path.resolve(__dirname, '../../node_modules/@jsnix/xterm'),
        },
    },
});
