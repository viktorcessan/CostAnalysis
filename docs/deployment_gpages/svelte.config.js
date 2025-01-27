import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			strict: false,
			precompress: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/CostAnalysis' : '',
			assets: process.env.NODE_ENV === 'production' ? 'https://viktorcessan.github.io/CostAnalysis' : ''
		},
		appDir: '_app',
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// ignore deliberate link to shiny 404 page
				if (path === '/404') {
					return;
				}
 
				// otherwise fail the build
				throw new Error(message);
			}
		}
	},
	preprocess: vitePreprocess()
};

export default config;
