# Elshan Neymatov — portfolio

Portfolio site (desktop and mobile): Astro 5 on Cloudflare Pages, content managed with Keystatic.

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
- Images edited in Keystatic are stored by field path: `public/images/site/` for Site content and `public/images/projects/<slug>/` for each project. Keystatic renames files on the first save; that is expected.
- The About hero shows the story cards on a WebGL ring (three.js, loaded lazily); without WebGL they fall back to a horizontal scroll-snap row.
- `updated-design/` (not committed) holds the approved prototype and handoff the site was rebuilt from.
