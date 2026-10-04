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

## Add a collection

Add an Arabic source JSON file under `scripts/source-data/arabic`, list it in `scripts/import-data.mjs`, document its exact provenance and rights in `DATA_SOURCES.md`, then run `npm run data:build`. Arabic is the only required content. The import pipeline writes static collection indexes and Arabic chapter files under `public/data/<collection>`.

### Add a translation

Add a separate file under `scripts/source-data/translations/<language>`. Its metadata block must name the source, exact URL, translator, licence, and retrieval date. List the file in `translationFiles` in `scripts/import-data.mjs`, then run `npm run data:build`. Generated translations live independently at `public/data/translations/<language>/<collection>/<chapter>.json`; adding or removing one never changes the Arabic dataset.

### Prepare fawazahmed0 data for review

Place downloaded editions in the ignored `scripts/raw-data` directory, then run:

```bash
npm run data:adapt:fawaz -- scripts/raw-data/ara-edition.json scripts/raw-data/eng-edition.json collection-id
```

The adapter writes ignored review files under `scripts/source-data/real`. Do not move them into tracked sources until every `[REQUIRED ...]` field is completed and `DATA_SOURCES.md` confirms the licence and provenance of each file.

## Free deployment

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`

### GitHub Pages

For a project site, build with the repository subpath as Vite's base and publish `dist`:

```bash
npm run build -- --base=/YOUR-REPOSITORY-NAME/
```

For a user or organization site at the domain root, use the normal `npm run build`. The site is entirely static.

## Privacy and offline behavior

- No accounts, cookies, analytics, or external runtime requests.
- Fonts are bundled with the app.
- Bookmarks, folders, progress, and settings stay in IndexedDB on the device.
- The service worker precaches the app shell and caches only same-origin dataset files as they are read.
- Removing site data in the browser removes all locally stored user data and offline caches.
