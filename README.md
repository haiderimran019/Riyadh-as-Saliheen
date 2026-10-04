# Hadith App

A private, ad-free, offline-capable hadith reading PWA. The app is static and has no backend, accounts, cookies, analytics, or runtime third-party requests.

Bookmarks, bookmark folders, reading progress, themes, and reader settings are stored only in the browser with IndexedDB.

> **Content status:** this repository currently contains fake placeholder records only. See `DATA_SOURCES.md` before adding or publishing real religious content.

## Run locally

```bash
npm install
npm run data:build
npm run dev
```

## Build and test

```bash
npm test
npm run build
```

The production build includes a Workbox service worker. The app shell is precached; Arabic chapters and optional translation files are cached on-device after first use.

## Data modes

`VITE_DATA_MODE=placeholder` is the default and reads only the tracked fake records. Real imported data stays under the ignored `data-local` directory and is selected with `VITE_DATA_MODE=real`.

Fetch the authorized stage 5a languages with at most two delayed, retrying requests at a time:

```bash
npm run data:fetch:hadeethenc -- --languages=ar,en,ur,bn,hi
```

The fetch is resumable from cached raw responses. Use the same `--languages` flag for a later stage; stage 5b is not part of the current pass.

### Add a translation

Add a separate file under `scripts/source-data/translations/<language>`. Its metadata block must name the source, exact URL, translator, licence, and retrieval date. List the file in `translationFiles` in `scripts/import-data.mjs`, then run `npm run data:build`. Generated translations live independently at `public/data/translations/<language>/<collection>/<chapter>.json`; adding or removing one never changes the Arabic dataset.

## Deploy

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment: set `VITE_DATA_MODE`; for feedback, set `VITE_FEEDBACK_ENDPOINT` and `VITE_FEEDBACK_KEY` and ensure the endpoint host appears in `public/_headers` under `connect-src`.
- The tracked `wrangler.toml`, `public/_redirects`, and `public/_headers` provide the Pages output directory, SPA fallback, CSP, and security headers.

### GitHub Pages

For a project site, build with the repository subpath as Vite's base and publish `dist`:

```bash
npm run build -- --base=/YOUR-REPOSITORY-NAME/
```

For a user or organization site at the domain root, use the normal `npm run build`. The site is entirely static.

GitHub Pages does not apply `public/_headers`; set equivalent headers at a proxy or custom domain if those controls are required. The workflow in `.github/workflows/ci.yml` only tests and builds—it does not deploy and contains no secrets.

## Privacy and offline behavior

- No accounts, cookies, analytics, or external runtime requests.
- Fonts are bundled with the app.
- Bookmarks, folders, progress, and settings stay in IndexedDB on the device.
- The service worker precaches the app shell and caches only same-origin dataset files as they are read.
- Removing site data in the browser removes all locally stored user data and offline caches.
