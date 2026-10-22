# Accounts, reminders, server rendering and owner access

This release preserves the approved home composition and reading design, adds Quran and prayer pages, and runs a real Node backend. Node 22.13 or newer is required. No cloud service is provisioned automatically.

## Start locally

From this repository:

```sh
npm ci --legacy-peer-deps
npm run dev:reader
```

The UI opens at http://127.0.0.1:5173, with its API on loopback port 8787. `server/.env.local` supplies private configuration. Copy `server/.env.example` for a fresh checkout. The launcher sets real data mode and the root base path. Imported religious data must exist under `data-local/generated`; reimport with the documented data scripts if missing.

## Create the owner's account

1. Open `/account`, choose Create account, and register with the email configured privately as `RIYAD_OWNER_EMAIL`. Choose your own password; do not put passwords in source or chat.
2. Accept the account privacy notice. Location and notification consent are separate and optional.
3. In local development, verification email is written to `.data/mail`, not sent to an inbox. On your computer run:

   ```sh
   npm run mail:latest -- your-owner-email@example.com
   ```

   Open the resulting private verification link yourself. This tool also opens the latest password-reset link for an email. Do not share its output or screenshots of links. Links expire after one hour; local outbox messages are removed after 24 hours or account deletion.
4. Run `npm run owner:grant`. The CLI grants only the configured owner email and requires an existing, verified account that accepted the current privacy notice. The first registered user never becomes an administrator automatically.
5. Refresh Account and open Owner dashboard at `/admin`. Name, email, account dates, consented approximate location, notification device count, and reminder preferences are available. Export CSV or JSON from that screen. Owner access is checked on every API request and exports are audited. Password hashes, session tokens, OAuth tokens and push encryption keys are excluded.

The owner CLI requires local filesystem access. Do not expose it as an HTTP endpoint. User account IDs scope all ordinary account routes. Regular users cannot read owner data or another account's location/export.

## Where the data is stored

| Location | Contents | Access |
| --- | --- | --- |
| `.data/riyad.sqlite` plus WAL/SHM | Auth users, hashed credentials, sessions, consent history, last saved location, reminder settings, push subscriptions and durable jobs | Backend and trusted operator only |
| `.data/auth-secret.json` | Stable signing secret | Backend only |
| `.data/vapid.json` | Web Push public/private key pair | Backend only; only public key is sent to clients |
| `.data/mail/` | Development-only verification/reset links | Local operator only; never an HTTP resource |
| Browser IndexedDB | Bookmarks, folders, progress, reader settings and chosen local prayer location | That browser; included in a user's requested local export |
| `data-local/generated/` | Imported source religious content and provenance | Public reading dataset; separate from account data |

Private files have mode 600 and their containing directory mode 700 on this Mac. They are Git-ignored and denied by Vite. Production serves only `dist`, with an allowlisted server renderer; it never serves the repository root. Account exports are downloads, not public URLs. Treat exported locations and emails as private data.

Name/email are collected only on signup. GPS is requested on a button press. Coordinates are sent transiently to this backend for prayer calculations and are not sent to third-party prayer APIs. An explicit additional checkbox is required to save coordinates to an account. Stored coordinates are rounded to three decimal places, roughly 100 metres, with one last location rather than tracking/history. Removing that location disables prayer reminders. There is no hidden reading telemetry. HTTP hosting/proxy logs are an operator responsibility and must not record request bodies or login links.

## Prayer times and Quran

Prayer calculations use Adhan with explicit coordinates, date, IANA timezone, selectable calculation method and standard/Hanafi Asr. Sunrise is displayed separately and never scheduled as a prayer. GPS timezone defaults to the device timezone; readers can change it. Congregation times remain the local mosque's timetable.

The full Quran import contains 114 surahs and 6,236 ayahs, Arabic, English translation and supplied notes. QuranEnc edition key `english_saheeh` is published as **English Translation - Noor International Center**, version **1.1.2** at this import. The key is not used as the translator's displayed name. Quran Foundation supplies chapter-name/count metadata. English is on by default and can be toggled immediately; text is unchanged. Run `npm run data:import:quran` to refresh the complete edition, retaining publisher/version metadata.

## Push reminders

Users separately select daily hadith, daily ayah, five prayer reminders, and vibration. Default daily times are 09:00 and 14:00. The ayah reminder is always scheduled exactly five elapsed hours after the hadith reminder, including DST transitions and midnight. A timezone and calculation method are explicit. Prayer reminders require a saved account location.

The browser requests notification permission only after the reader chooses to connect a device. The application stores the resulting push subscription privately. A persistent job queue plans future reminders, claims jobs with leases, retries temporary failures, deduplicates successful device sends, removes expired subscriptions and cancels disabled reminders. Jobs older than 30 days are removed. Notifications link to the complete source text, rather than truncating a religious quotation. Signing out disconnects the current browser's push subscription.

Run the backend continuously for scheduled delivery. A sleeping/stopped laptop cannot send reminders. Device settings, network conditions and push providers can delay delivery. Vibration is best-effort and is unsupported in Safari and some other browsers. iPhone/iPad push requires an installed Home Screen web app on a supported OS and a user gesture. The service worker handles visible push only; it does not cache religious text for offline reading. Production needs HTTPS and unchanged VAPID keys on a persistent private volume. Real-device delivery and vibration must be tested on the actual deployment and device; synthetic tests do not prove that physical delivery occurred.

## Email and Google configuration

For real verification/reset delivery, set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD and SMTP_FROM privately. Use your mail provider's TLS port/settings and verified sender domain. Do not disable TLS validation. In production, SMTP and an HTTPS APP_ORIGIN are mandatory. Verification is required before password login and saving account data. Reset tokens expire; successful password reset revokes sessions.

Google is prepared but deliberately unavailable until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured. In Google Cloud create a Web OAuth client, configure its consent screen, and add the exact callback:

- Local: `http://127.0.0.1:5173/api/auth/callback/google`
- Public: `https://your-domain.example/api/auth/callback/google`

Use the actual APP_ORIGIN and the same host throughout login; localhost and 127.0.0.1 are different origins. Configure Google publishing/test-user settings as appropriate. Never put secrets in VITE_ variables. Restart the backend after changing its environment. Google-created accounts review the app privacy notice before saving data. Cross-provider account linking is disabled.

## Production hosting and SEO

```sh
npm run build:server
npm start
```

Use one continuously running Node process with a persistent private SQLite volume, a reverse proxy terminating HTTPS, and generated content alongside `dist` and `.server-dist`. Configure APP_ORIGIN, API_HOST/API_PORT, RIYAD_DATA_DIR, owner email, SMTP, VAPID_SUBJECT and optional OAuth. Back up the database consistently using SQLite's backup mechanism rather than copying an active WAL file alone; encrypt backups, restrict access and define retention/restoration procedures. Do not run independent ephemeral replicas against separate SQLite files. Use shared database/queue infrastructure before scaling to multiple app instances.

Public routes use the same React components for server HTML and client hydration. Home content, catalogue entries, chapter passages, Quran text/translations and legal pages are delivered in initial HTML. Personal bookmarks and browser preferences remain local and enhance the hydrated view. Private account data is fetched only through authenticated APIs and is never embedded in a shared HTML response. No JavaScript is needed to follow public reading links; noscript navigation supplements controls where needed.

Each route has a descriptive title, description, canonical URL, Open Graph/Twitter metadata and safe JSON-LD. `/sitemap.xml` lists public reading routes, stable `?hadith=` passage links, and paginated Quran pages. `/robots.txt` excludes account/admin/API/settings/search/saved/reminder pages. Private pages send noindex and no-store; localhost is always noindex. Unknown routes return 404. Canonical domains come from configured APP_ORIGIN rather than an untrusted Host header. Search ranking and indexing are not guaranteed; submit the public sitemap to Search Console after a real deployment.

GitHub Pages and a static Pages upload cannot execute this backend, scheduler or per-request SSR. Existing static deployment workflows are legacy reader-only publishing paths and are not the deployment mechanism for this release. No deployment is performed by local development or this task.

## Security and release checks

Server-side ownership checks, verified login, explicit consent, HTTP-only SameSite cookies, HTTPS-only production cookies, exact-origin mutation checks, per-account/IP throttles, schema validation, body limits, SQL parameter binding, safe CSV export, push-host validation and account deletion cascades protect the new API. Production adds nonce-based script CSP, frame denial, HSTS, nosniff, restricted permissions, request timeouts and no public source maps. No application can be guaranteed immune to attacks; keep dependencies patched and audit the real host, proxy, mail, OAuth configuration and backups before opening registration publicly.

```sh
npm run typecheck
npm run lint
npm test
npm run test:backend
npm run build:server
npm run test:ssr
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npx playwright test --workers=2
npm audit
```

Backend tests create isolated temporary databases. They exercise signup/verification/login, consent, account separation, owner authorization/export and deletion. Scheduler tests use injected push delivery and check five-hour spacing, DST, retries and cancellation. SSR tests start an isolated production-mode server, without sending mail, and check initial HTML, private-file protection, headers, SEO and 404s. Browser tests use disposable ordinary accounts; never grant an owner role in the active preview to simplify a UI test.

Before public launch, supply actual operator contact information in the privacy policy, hosting-provider details and backup retention. Review applicable jurisdictional requirements with appropriate expertise. Do not publish credentials, private exports or local verification URLs.
