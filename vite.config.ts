import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	base: process.env.NODE_ENV === 'production' ? '/CostAnalysis/' : '/',
	build: {
		rollupOptions: {
			external: ['html-to-image']
		}
	}
});
