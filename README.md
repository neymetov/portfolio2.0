# Elshan Neymatov — portfolio

Portfolio site (desktop and mobile): Astro 5 on Cloudflare Pages, content managed with Keystatic.

Pages: About (`/`), Works (`/works`), case studies (`/works/[slug]`), Contacts (`/contacts`).

## Development

```sh
npm install
npm run dev      # http://localhost:4321
```

The admin lives at `/keystatic`. Without a cloud project it runs in local mode and writes straight to the files in `src/data/` and `public/images/`.

## Checks and tests

```sh
npm run check         # type check (astro check, unused code included) + unit tests + every media path in content exists
npm run verify        # check + build + every link and file in the built pages exists
npm run test          # unit tests only (tests/, node:test through tsx)
npm run check:links   # after a build: pages in dist/ point only at things that exist
```

## Content

- `src/data/site.json` — texts, story cards, experience, the "some big projects" picks, contacts (edit via Keystatic → Site content).
- `src/data/projects/*.json` — case studies (Keystatic → Projects).
- Schema: `keystatic.config.ts`.

## Deploy (Cloudflare Pages)

```sh
npm run build    # astro check + astro build → dist/
npm run deploy   # build + wrangler pages deploy dist
npm run cf:preview   # serve dist/ locally on the Workers runtime (wrangler 4.86 needs the older compatibility date, set in the script)
```

Cloudflare build settings: build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION=22`.
`wrangler.toml` has `pages_build_output_dir`, so Cloudflare reads the project settings from it.

Unknown addresses return a real 404: `src/pages/404.astro` is built to `dist/404.html`. Without that file Cloudflare Pages
treats the site as a single-page app and answers every unknown address with the home page and status 200.

### Sessions

The site and Keystatic do not use `Astro.session`. `astro.config.mjs` sets `session: { driver: 'memory' }` so the Cloudflare
adapter does not switch on its KV-backed session store, which would need a `SESSION` KV binding. If sessions are ever needed:

```sh
npx wrangler kv namespace create SESSION          # note the id it prints
npx wrangler kv namespace create SESSION --preview
```

then add it to `wrangler.toml` (`[[kv_namespaces]]` with `binding = "SESSION"`, the `id` and the `preview_id`), remove the
`session` option from `astro.config.mjs`, and bind the same namespace in the Pages project (Settings → Bindings → KV namespace).

### Keystatic on the live site

1. Create a project in Keystatic Cloud and connect this GitHub repository.
2. Set `PUBLIC_KEYSTATIC_CLOUD_PROJECT=team/project` (see `.env.example`) in the Cloudflare Pages environment variables.

## Media

Big uploads slow the site down. Keystatic stores whatever is uploaded, so after uploading heavy pictures run:

```sh
node scripts/optimize-images.mjs            # report: PNG/JPG over 500 KB and what WebP would save
node scripts/optimize-images.mjs --write    # create the .webp files next to the originals and point src/data at them
```

Originals are kept; delete them once the site looks right. Videos: export from your editor as H.264 mp4 with
"Web optimized / Fast Start" turned on, without sound, up to 1920 px wide (cards and covers are shown much smaller: 960 px is plenty).
If a file was exported without Fast Start, `scripts/faststart.py file.mp4` fixes it without re-encoding.
With ffmpeg installed (`brew install ffmpeg`), `scripts/optimize-videos.sh --write` re-encodes every mp4 over 1.5 MB to `<name>.web.mp4`.

Videos marked as looping covers load their first bytes only; they download fully and play when they come near the screen,
and pause again when they leave it. With "reduce motion" turned on they do not play.

## Updating dependencies

Astro 5, `@astrojs/cloudflare` 12 and wrangler 4.86 are the newest versions that run on Node 20 and deploy to Cloudflare *Pages*.
The remaining `npm audit` findings are fixed only by Astro 6/7 and `@astrojs/cloudflare` 13/14, which need Node 22.12+ (Astro 7: 22.23.4+)
and target Cloudflare *Workers* instead of Pages (a different deploy setup). Before attempting that: upgrade Node, then
Astro, the adapter and wrangler together, move the project to Workers, and re-check `/keystatic`.

## Notes

- Images edited in Keystatic are stored by field path: `public/images/site/` for Site content and `public/images/projects/<slug>/` for each project. Keystatic renames files on the first save; that is expected.
- The About hero shows the story cards on a WebGL ring (three.js, loaded lazily); without WebGL they fall back to a horizontal scroll-snap row.
- `updated-design/` (not committed) holds the approved prototype and handoff the site was rebuilt from.
