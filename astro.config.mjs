import { defineConfig } from 'astro/config';

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://new.entire.life',
  integrations: [react()],
  vite: {
    sourcemap: true,
  },
});
