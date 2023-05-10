import { defineConfig } from 'astro/config';

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://new.entire.life',
  integrations: [react()],
  vite: {
    build: {
      sourcemap: true,
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: new URL('src/data/backends/google/worker.ts', import.meta.url),
        formats: ['es'],
        // set fileName to, for example, `googleWorker.js`
        fileName: 'googleWorker',
      },
    },
  },
});
