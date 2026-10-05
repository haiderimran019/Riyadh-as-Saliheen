# Hadith Reader

A free, ad-free, online Riyad as-Salihin reading site. The app is static and has no backend, accounts, cookies, or analytics. It makes no third-party runtime requests except an optional feedback submission.

Bookmarks, bookmark folders, reading progress, themes, and reader settings are stored only in the browser with IndexedDB.

The Arabic collection and English translation are supplied by IslamHouse.com / IslamEnc.com and displayed as published. See `DATA_SOURCES.md` and `NOTICE` for source and reuse details.

Every screen follows the shared responsive, accessible interface rules in `DESIGN_STANDARDS.md`.

## Run locally

```bash
npm install
npm run data:import:riyad -- --languages=ar,en
npm run data:import:quran-day
VITE_DATA_MODE=real npm run dev
```

## Build and test

```bash
npm test
npm run build
npm run test:overflow
npm run verify
```

The production site requires an internet connection. It does not register a service worker or intentionally cache reading content for offline use.

## Data modes

The default mode is `placeholder`, which shows an empty preview shell and never substitutes sample religious text. Import Riyad and daily Quran data into the ignored `data-local/generated` directory, then set `VITE_DATA_MODE=real` to read it locally or build it into static output. The Hadith of the Day uses the Riyad edition; the Ayah of the Day uses QuranEnc Arabic and English/Urdu meanings. The static site serves these data files over the internet. Riyad currently has no verified Urdu translation in this release. Urdu mode keeps the Arabic source visible and reports the gap instead of showing English as Urdu.

Fetch the authorized stage 5a languages with at most two delayed, retrying requests at a time:

```bash
npm run data:import:riyad -- --languages=ar,en
npm run data:import:quran-day
```

The import is resumable from cached raw pages. The reader bundles Arabic and English files into the build output; those files are generated locally and never committed.

## Deploy

### Cloudflare Pages

- Build command: `npm run data:import:riyad -- --languages=ar,en && npm run data:import:quran-day && VITE_DATA_MODE=real npm run build`
- Output directory: `dist`
- Environment: fetch approved data in the build job; for feedback, set `VITE_FEEDBACK_ENDPOINT` and `VITE_FEEDBACK_KEY` and ensure the endpoint host appears in `public/_headers` under `connect-src`.
- The tracked `wrangler.toml`, `public/_redirects`, and `public/_headers` provide the Pages output directory, SPA fallback, CSP, and security headers.

### GitHub Pages

Pushing `main` runs `.github/workflows/static.yml`, which imports the approved corpus, builds with the repository subpath, and deploys `dist` to the existing Pages site. To reproduce that build locally:

```bash
npm run data:import:riyad -- --languages=ar,en
npm run data:import:quran-day
VITE_DATA_MODE=real VITE_BASE_PATH=/Riyadh-as-Saliheen/ npm run build
```

For a user or organization site at the domain root, use `VITE_BASE_PATH=/`. The site is entirely static.

GitHub Pages does not apply `public/_headers`; set equivalent headers at a proxy or custom domain if those controls are required. The separate CI workflow validates, tests, and builds without deploying. The Pages workflow publishes only after a push to `main` or a manual workflow dispatch.

## Privacy and online behavior

- No accounts, cookies, analytics, or external runtime requests.
- Fonts are bundled with the app.
- Bookmarks, folders, progress, and settings stay in IndexedDB on the device.
- The app requires internet access to load its interface and reading content; it does not intentionally provide offline reading or installable offline behavior.
- Bookmarks, folders, progress, and settings remain stored locally in the browser.
