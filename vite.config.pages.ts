import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the demo app (index.html) for GitHub Pages. The library build is vite.config.ts.
export default defineConfig({
  plugins: [react()],
  base: '/aruco-tag-generator/',
  build: {
    outDir: 'dist-pages',
    emptyOutDir: true,
  },
});
