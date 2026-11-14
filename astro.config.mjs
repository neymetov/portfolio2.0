import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://neymetov.com',
  output: 'server',
  // /works instead of /works/: pages are built as works.html, so Cloudflare Pages serves the address the links and
  // canonical tags use, instead of redirecting every page to a trailing-slash twin.
  build: { format: 'file' },
  trailingSlash: 'never',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react(), keystatic()],
  // The site and Keystatic do not use Astro.session. Without an explicit driver the Cloudflare adapter turns on
  // a KV-backed session store and asks for a "SESSION" KV binding that this project does not have. If sessions
  // are ever needed, replace this with a real KV driver (see the README, "Sessions").
  session: { driver: 'memory' },
  vite: {
    ssr: {
      noExternal: [/^@keystatic\//, 'minimatch'],
      // src/lib/share.ts reads file sizes with node:fs while the pages are prerendered; it never runs in the worker.
      external: ['node:fs/promises', 'node:path'],
    },
  },
});
