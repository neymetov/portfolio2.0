import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://neymetov.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react(), keystatic()],
  vite: {
    ssr: {
      noExternal: [/^@keystatic\//, 'minimatch'],
    },
  },
});
