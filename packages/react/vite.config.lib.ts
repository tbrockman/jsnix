import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
	base: './',
	cacheDir: '../../node_modules/.vite',
	esbuild: {
		supported: {
			'top-level-await': true,
		},
		pure: mode === 'production' ? ['console.log', 'console.debug', 'debugger'] : [],
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'lib/index.ts'),
			formats: ['es'],
		},
		rollupOptions: {
			external: ['react', 'react/react-dom', 'monaco-editor', '@webcontainer/api'],
			output: {
				assetFileNames: 'assets/[name][extname]',
				entryFileNames: '[name].js',
			},
		},
	},
	plugins: [
		react(),
		libInjectCss(),
		dts({ include: ['lib'] }),
	],
	define: {
		APP_VERSION: JSON.stringify(process.env['npm_package_version']),
	},
}));
