# Elshan Neymatov — portfolio

Mobile-first portfolio site: Astro 5 on Cloudflare Pages, content managed with Keystatic.

Pages: About (`/`), Works (`/works`), case studies (`/works/[slug]`), Contacts (`/contacts`).

## Development

```sh
npm install
npm run dev      # http://localhost:4321
```

The admin lives at `/keystatic`. Without a cloud project it runs in local mode and writes straight to the files in `src/content/` and `public/images/`.

## Content

- `src/content/site.json` — texts, story cards, experience, services, contacts (edit via Keystatic → Site content).
- `src/content/projects/*.json` — case studies (Keystatic → Projects).
- Schema: `keystatic.config.ts`.

## Deploy (Cloudflare Pages)

```sh
npm run build    # astro check + astro build → dist/
npm run deploy   # build + wrangler pages deploy dist
```

### Keystatic on the live site

1. Create a project in Keystatic Cloud and connect this GitHub repository.
2. Set `PUBLIC_KEYSTATIC_CLOUD_PROJECT=team/project` (see `.env.example`) in the Cloudflare Pages environment variables.

## Notes

- Replace the placeholder `contactEmail` in `src/content/site.json` before publishing.
- The hero flipbook frames are in `public/images/hero/` (1–7).
