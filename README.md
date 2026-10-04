# Hadith Reader

A free, ad-free, offline-capable Riyad as-Salihin reading PWA. The app is static and has no backend, accounts, cookies, or analytics. It makes no third-party runtime requests except an optional feedback submission.

Bookmarks, bookmark folders, reading progress, themes, and reader settings are stored only in the browser with IndexedDB.

The Arabic collection and English translation are supplied by IslamHouse.com / IslamEnc.com and displayed as published. See `DATA_SOURCES.md` and `NOTICE` for source and reuse details.

## Run locally

```bash
npm install
npm run data:import:riyad -- --languages=ar,en
VITE_DATA_MODE=real npm run dev
```

## Build and test

```bash
npm test
npm run build
npm run test:overflow
npm run verify
```

The production build includes a Workbox service worker. The app shell is precached; Arabic chapters and optional translation files are cached on-device after first use.

## Data modes

The default mode is `placeholder`, which shows an empty preview shell and never substitutes sample religious text. Import Riyad data into the ignored `data-local/generated` directory, then set `VITE_DATA_MODE=real` to read it locally or build it into a temporary static output.

Fetch the authorized stage 5a languages with at most two delayed, retrying requests at a time:

```bash
npm run data:import:riyad -- --languages=ar,en
```

The import is resumable from cached raw pages. The reader bundles Arabic and English files into the build output; those files are generated locally and never committed.

## Deploy

### Cloudflare Pages

- Build command: `npm run data:import:riyad -- --languages=ar,en && VITE_DATA_MODE=real npm run build`
- Output directory: `dist`
- Environment: fetch approved data in the build job; for feedback, set `VITE_FEEDBACK_ENDPOINT` and `VITE_FEEDBACK_KEY` and ensure the endpoint host appears in `public/_headers` under `connect-src`.
- The tracked `wrangler.toml`, `public/_redirects`, and `public/_headers` provide the Pages output directory, SPA fallback, CSP, and security headers.

### GitHub Pages

For this project site, import the approved corpus and build with the repository subpath before publishing `dist`:

```bash
npm run data:import:riyad -- --languages=ar,en
VITE_DATA_MODE=real VITE_BASE_PATH=/Riyadh-as-Saliheen/ npm run build
```

For a user or organization site at the domain root, use `VITE_BASE_PATH=/`. The site is entirely static.

GitHub Pages does not apply `public/_headers`; set equivalent headers at a proxy or custom domain if those controls are required. The CI workflow validates, tests, and builds without deploying. For a manual GitHub Pages release, publish `dist` and keep the generated `404.html` fallback; no deployment is performed by this repository.

## Privacy and offline behavior

- No accounts, cookies, analytics, or external runtime requests.
- Fonts are bundled with the app.
- Bookmarks, folders, progress, and settings stay in IndexedDB on the device.
- The service worker precaches the app shell and caches only same-origin dataset files as they are read.
- Removing site data in the browser removes all locally stored user data and offline caches.
