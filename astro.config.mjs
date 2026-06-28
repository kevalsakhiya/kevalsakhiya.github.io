// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages user site (served at the domain root).
// If you later move to a custom domain, just change `site`.
export default defineConfig({
  site: 'https://kevalsakhiya.github.io',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
