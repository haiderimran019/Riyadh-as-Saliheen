# Public Riyad service

The full app uses the Vercel project `riyad-as-salihin` in `haiderimran019`, at https://riyad-as-salihin.vercel.app. The approved home composition is unchanged. Public reading pages render on the server, while account APIs use private Neon Postgres in Singapore. The local SQLite database is never uploaded.

## Build and deploy

`npm run build:cloud` imports missing attributed religious datasets, builds the client and React server renderer, and packages Express with Nitro and Workflow. On a Vercel production build it applies additive auth/application migrations through the direct database connection. Runtime connections use the pooled URL with certificate validation. The project uses Node 22, with functions in Singapore.

Configure only production with `APP_ORIGIN`, `RIYAD_OWNER_EMAIL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, the Google client pair, and SMTP settings. Keep private values in Vercel Secrets. Never put them in `VITE_` variables. Preview environments need their own database, origin and credentials before account testing.

After installing dependencies and selecting the private production environment, run `npm run db:migrate` for an explicit operator migration. Never run disposable API fixtures against the production schema. `npm run test:postgres` creates and removes a random isolated test schema using the direct URL from the ignored `.env.production.local`; it does not alter production accounts.

Vercel Git integration should track `main`. Keep GitHub CI enabled for unit, backend and server-rendering checks. A prebuilt CLI deployment uses `vercel deploy --prebuilt --prod --scope haiderimran019` only after checking the exact output. `.vercel`, private `.env` files, local accounts and generated provider skill caches stay ignored.

## Sign-in and email

Gmail SMTP uses TLS on port 465 and a dedicated Google app password. Configure the private password in the server/hosting environment; never use the normal Google account password. Verification and password-reset links use the exact public origin. Password accounts require email verification. Existing pending accounts can request a new message from Account → Already registered but not verified?. Gmail sending limits still apply.

The Google web client has exact localhost and production callbacks. Public users need the consent screen published for an external audience; Testing limits access to configured test users. Permissions are limited to openid/email/profile. Existing password accounts must verify their email before same-email linking. OAuth tokens are encrypted; passwords, session credentials and provider tokens are excluded from data exports.

## Get your user data

1. Sign in at `/account` with the configured owner address and accept the current privacy notice.
2. From this trusted checkout, load the ignored production environment and run the owner CLI:

   ```sh
   node --env-file=.env.production.local --env-file=.env.vercel-private.local scripts/owner-tools.mjs grant
   ```

3. Refresh `/account`, then open `/admin`. The server verifies the owner role on every request. Download CSV or JSON there. The export contains name/email, dates, reminder preferences and only the locations readers separately consented to save.

The first signup never becomes an owner automatically. Only the configured, verified owner email can receive the role. Do not share exports or expose the operator CLI as a web route. Ordinary readers can export/delete their own account data from Account.

## Reminders and retention

Vercel Workflow sleeps durably until each opted-in hadith, ayah or prayer occurrence. Hadith and ayah times remain five elapsed hours apart across DST and midnight. Jobs use database leases, device receipts, bounded retries and schedule generations. Preference changes invalidate older sleeping runs; disabling or deleting data stops future sends. The authenticated daily cron repairs stopped schedules and cleans expired security counters and reminder history.

Workflow arguments contain opaque user/schedule identifiers. Completed-run plaintext retention is set to zero. Account deletion cascades through active application tables; provider recovery/email retention remains subject to the providers. Reminder history is cleaned after 30 days during daily reconciliation, including for users who have stopped reminders. No additional operator backup archive is currently created.

Browser permission, device support and push-provider/network conditions govern real delivery. Vibration is best-effort; Safari does not support it. Physical device delivery and vibration need a real-device check and cannot be proven by injected delivery tests.
