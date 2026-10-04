# Hadith Reader

A free, ad-free, offline-capable hadith reading PWA. The app is static and has no backend, accounts, cookies, analytics, or runtime third-party requests.

Bookmarks, bookmark folders, reading progress, themes, and reader settings are stored only in the browser with IndexedDB.

Hadith text, translations, grades, and commentary are supplied by HadeethEnc.com and displayed unmodified. See `DATA_SOURCES.md` and `NOTICE` for source and reuse details.

## Run locally

```bash
npm install
npm run data:fetch:hadeethenc -- --languages=ar,en,ur,bn,hi
npm run dev
```

## Build and test

```bash
npm test
npm run build
```

The production build includes a Workbox service worker. The app shell is precached; Arabic chapters and optional translation files are cached on-device after first use.

## Data modes

`VITE_DATA_MODE=real` is the default. The app reads generated data from ignored `data-local/generated`; fetch it before running or building locally. `VITE_DATA_MODE=placeholder` shows an empty preview shell and never substitutes sample religious text.

Fetch the authorized stage 5a languages with at most two delayed, retrying requests at a time:

```bash
npm run data:fetch:hadeethenc -- --languages=ar,en,ur,bn,hi
```

The fetch is resumable from cached raw responses. Use the same `--languages` flag for a later stage; stage 5b is not part of the current pass.

## Deploy

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment: fetch approved data in the build job; for feedback, set `VITE_FEEDBACK_ENDPOINT` and `VITE_FEEDBACK_KEY` and ensure the endpoint host appears in `public/_headers` under `connect-src`.
- The tracked `wrangler.toml`, `public/_redirects`, and `public/_headers` provide the Pages output directory, SPA fallback, CSP, and security headers.

### GitHub Pages

For a project site, set Vite's `base` to the repository subpath and publish `dist`:

```bash
npm run build -- --base=/hadith-reader/
```

For a user or organization site at the domain root, use the normal `npm run build`. The site is entirely static.

GitHub Pages does not apply `public/_headers`; set equivalent headers at a proxy or custom domain if those controls are required. The Pages workflow fetches the approved public HadeethEnc dataset at build time and deploys `dist`; no secrets are used for content retrieval.

## Privacy and offline behavior

- No accounts, cookies, analytics, or external runtime requests.
- Fonts are bundled with the app.
- Bookmarks, folders, progress, and settings stay in IndexedDB on the device.
- The service worker precaches the app shell and caches only same-origin dataset files as they are read.
- Removing site data in the browser removes all locally stored user data and offline caches.
