# Riyad 0.3.0 — 23 October 2026

The new daily home brings together one current prayer, exact reading return links, a complete ayah and a complete hadith. In the interval after sunrise it clearly identifies the next prayer instead of calling sunrise a prayer. GPS is never fabricated when no location is available.

## Reader controls

Choose English, Urdu, Bengali or Arabic from the header. More opens reading settings; on Quran routes it additionally offers three English translations (Noor International, Rowwad, Hilali & Khan), two Urdu translations (Muhammad Junagarhi, Fateh Muhammad Jalandhry) and Bengali (Muhiuddin Khan). Source wording, notes and credits are preserved. Tanzil translations are for non-commercial use; consult the publisher before commercial reuse.

Uthmani and IndoPak use different authentic source texts. IndoPak loads Quran Foundation's matching Nastaleeq v4.2.1 font. Mushaf is a responsive flowing reading surface, not a reproduction of printed page boundaries. A font/source failure shows an error and an Uthmani fallback choice rather than relabelling the wrong script. Each reader page contains up to 20 complete ayahs; saved links preserve exact targets across translation changes.

The interface supports Bengali; this does not create a Bengali hadith edition. The current hadith source supplies Arabic, published English and partial matching Urdu. Unavailable translations are explicitly identified.

## Account and owner access

Open https://riyad-as-salihin.vercel.app/account and continue with Google. Only basic name/email/profile scopes are requested. New Google accounts review the current account privacy notice before saving optional data. Existing users can review it in Account. The configured verified owner opens `/admin`; ownership is never assigned to the first signup.

The owner dashboard shows registered accounts and consented latest locations, plus opted-in session totals, observed durations, active time, launch frequency, hourly starts, page categories, feature clicks, navigation paths and location/reminder/settings funnels. Reports contain actual opted-in activity, with an empty state until data exists. CSV/JSON account exports and a separate usage JSON export remain owner-only and audited. Account exports include their own server data and this device's hadith/Quran bookmarks, progress and settings.

Analytics starts off. Readers may decline, then change their choice in Account. Withdrawal deletes previous sessions and events; daily reconciliation removes usage older than 30 days. Durations and abandoned tasks are observations; browser-close delivery cannot be guaranteed. No verse/hadith references, search strings, input text, credentials or GPS is collected as usage analytics.

## GPS and prayer

Use my location requests the browser/OS permission. A fast cached/network fix and a high-accuracy foreground watch run together; stale fixes cannot overwrite newer coordinates. Offline coordinate lookup selects the timezone without requiring a city. Denial and slow GPS have actionable messages; manual cities remain available. Devices can provide only approximate fixes, and the reported accuracy is displayed.

Location stays on this device unless separately saved. Approximate sharing and precise sharing have separate explicit choices. Only the latest fix is stored. Live sharing replaces that fix at most once per minute while visible, stops on sign-out, and cannot silently restore deleted account coordinates. Prayer school offers Hanafi/Shafi only, including reminders; regional Fajr/Isha convention is automatic. Mosque congregation times may differ.

## Operations and verification

`npm run build:cloud` imports every missing edition, builds SSR and adds the application tables through the direct Neon connection before serving schema version 2. Existing accounts/roles are preserved. Private env files, SQLite accounts and secrets remain excluded from Git and deployment source uploads. Google access is the default; `RIYAD_REQUIRE_GOOGLE=0` exists only for explicitly isolated tests/operator recovery and must not be used to open production.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:backend`, `npm run build:server`, `npm run test:ssr` and the explicitly isolated `npm run test:postgres`. GPS permission, physical notification delivery and vibration still depend on the real browser/device; simulated tests cannot certify hardware delivery.
