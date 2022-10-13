import { defineConfig } from 'astro/config';

// https://astro.build/config
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://chadoh.com',
  base: '/entire-life-offline-first',
  integrations: [react()],
});