# Riyad as-Salihin

A free, ad-free reading space for Riyad as-Salihin, the Quran with English translation, and location-based prayer times. The approved botanical reading design is preserved. Optional verified accounts support consented saved locations and daily/prayer push reminders.

The application now has a Node/SQLite backend and React server rendering. Name/email are collected at signup; saving a location and connecting notifications each require separate consent. Bookmarks, folders, progress and display settings remain in browser IndexedDB. Fonts and imported reading text are served by the app; there are no advertising trackers.

Arabic/English Riyad text comes from IslamHouse / IslamEnc. Available Urdu is partial HadeethEnc matching narrations. Quran text, translation and notes come from QuranEnc with edition attribution. See [DATA_SOURCES.md](DATA_SOURCES.md) and NOTICE. Source wording is preserved.

## Links and collection

- [GitHub repository](https://github.com/haiderimran019/Riyadh-as-Saliheen)
- [Public reading website](https://haiderimran019.github.io/Riyadh-as-Saliheen/) — automatically published from `main`, with the new design, hadith, full Quran, on-device prayer calculations and browser-only saved passages. Accounts and server push require the separately hosted Node backend.

The Riyad import contains 364 chapters, 1,892 Arabic narrations and 1,873 paired English translations. Available Urdu covers 238 matching entries and is not a complete Urdu edition. The full Quran reader contains 114 surahs and 6,236 ayahs. Search, chapter discovery, saved folders, reading progress, English/Urdu interface and responsive layouts remain available.

The stack uses React, TypeScript, Vite, React Router and Lucide, with MiniSearch, Dexie/IndexedDB, Zod, Better Auth, Express, native SQLite, Adhan and Web Push. Vitest, Node integration tests, Playwright and GitHub Actions support validation.

## Local development

Use Node 22.13 or newer:

```sh
npm ci --legacy-peer-deps
# For a fresh checkout, configure the ignored server/.env.local from server/.env.example.
npm run dev:reader
```

Open http://127.0.0.1:5173. The launcher starts the API on loopback port 8787 and selects real data mode at the root path. Existing imported data is preserved. If it is missing, import it first:

```sh
npm run data:import:riyad -- --languages=ar,en
npm run data:import:quran-day
npm run data:import:urdu
npm run data:import:quran
```

Imports remain ignored under `data-local/generated`. Default Vite-only placeholder mode remains available with `npm run dev`; it does not pretend to contain real religious text. The complete app requires the backend launcher above.

## Accounts and owner data

See [the account, owner, notification and deployment guide](docs/ACCOUNTS-AND-REMINDERS.md). Register and verify your configured owner email, then run `npm run owner:grant` and open `/admin`. The dashboard has private CSV/JSON exports. No user is made an owner automatically.

Locally, mail is stored privately rather than sent. For verification, choose **Already registered but not verified?**, enter your email and resend, then run `npm run mail:verify -- your-email@example.com` yourself. It opens your own private verification link without printing its token. `npm run mail:latest -- your-email@example.com` displays the latest private verification/reset link when needed. Real SMTP is required for production. Google OAuth is prepared and remains disabled until genuine credentials/callbacks are configured. Secrets, account data and consented locations are never bundled into public output.

## Build, validate and serve

```sh
npm run typecheck
npm run lint
npm test
npm run test:backend
npm run build:server
npm run test:ssr
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npx playwright test --workers=2
```

`npm run build:server` builds client assets and the React server renderer. `npm start` requires an HTTPS APP_ORIGIN, SMTP, VAPID contact and a persistent private database volume. Run one persistent Node process behind an HTTPS proxy; follow the deployment guide before public launch. The scheduler must remain running to send reminders. Delivery and vibration depend on device/browser support and notification permission.

Public pages ship reading HTML, route metadata, canonical links and structured data. Public reading URLs are listed in `/sitemap.xml`; personal pages are noindex. Localhost blocks indexing. The application does not provide offline reading.

`npm run build:pages` builds a static reading edition and prerenders the home, chapter, Quran and information pages. The Pages workflow publishes it on every push to `main`. Quran uses imported JSON; prayer times run on-device, including consented GPS. Personal pages explain that accounts and push need the Node service instead of presenting a broken login. Pages cannot run the SQLite account service, mail delivery, scheduled push or per-request server rendering. The persistent Node deployment remains a separate setup.
