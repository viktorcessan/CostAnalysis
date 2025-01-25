import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		assetsDir: '_app/immutable',
		rollupOptions: {
			output: {
				manualChunks: undefined
			}
		}
	},
	server: {
		fs: {
			strict: false
		}
	}
}); 