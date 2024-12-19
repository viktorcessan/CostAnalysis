import { defineConfig } from 'vite';

export default defineConfig({
  base: '/platform-cost-analysis/', // Updated repository name
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 