import { defineConfig } from 'astro/config';

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://new.entire.life',
  integrations: [react()],
  vite: {
    sourcemap: true,
    build: {
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: {
          googleWorker: new URL('src/data/backends/google/worker.ts', import.meta.url),
        },
        formats: ['es'],
        // set fileName to, for example, `googleWorker.js`
        fileName: (format, entryName) => `${entryName}.${format}`,
      },
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library, like React (should be unnecessary for workers,
        // since they don't import DOM stuff)
        external: [],
        output: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          // (again, probably not necessary for workers)
          globals: {
          },
        },
      },
    },
  },
});
