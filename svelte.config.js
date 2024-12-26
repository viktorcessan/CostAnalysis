import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/migrationapp' : ''
		},
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore base path errors during prerendering
				if (path === '/' || path.startsWith('/calculator')) {
					return;
				}
				throw new Error(message);
			},
			entries: ['/']
		}
	}
};

export default config;
