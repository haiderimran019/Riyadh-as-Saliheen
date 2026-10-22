# Architecture guide

## Boundaries

- `src/core` contains app-wide events and behavior that is not owned by a screen.
- `src/data` contains the repository contract, source adapters, cache, and local storage.
- `src/features/registry.tsx` is the single route and navigation registry. Screen modules are loaded lazily from `src/pages`.
- `src/ui` contains shared navigation and layout UI; screen-specific UI stays beside its screen until it is shared.
- `src/styles.css` contains design tokens, themes, and responsive component styles.

Features should depend on core, data, and shared UI, but not import another feature directly. `npm run lint` checks cross-feature imports.

## Data access

Pages call `HadithRepository`; the current `HadeethEncJsonAdapter` reads the build-generated static JSON through the shared loader. A new collection source should implement the adapter interface instead of teaching a page where files or endpoints live. Publisher API retrieval belongs in import scripts. The app’s own Node API serves imported Quran data and calculates prayer times at runtime; it also owns authenticated account and reminder operations.

## Adding a feature

1. Add a focused screen module and tests.
2. Register its route and, if it belongs in primary navigation, add its navigation entry in `src/features/registry.tsx`.
3. Keep reusable controls in `src/ui`; keep source and persistence logic in `src/data`.
4. Run `npm run verify` and ensure feature code does not import another feature.


## Server and private data

`server/` contains verified authentication, SQLite tables, consent, prayer calculation and the durable push worker. `src/services` is the same-origin frontend API boundary. Never import server modules or private environment into browser code. `server/public-render.mjs` prepares only public source data; `src/entry-server.tsx` renders the existing React tree, then the browser hydrates it. Account-specific data is fetched through checked APIs and is excluded from public bootstrap HTML.

Private SQLite/auth/VAPID/mail files live under ignored `.data/`, outside static serving. The production server serves `dist` plus its renderer in `.server-dist`; it requires a persistent Node host. The static GitHub Pages workflow is manual legacy publishing only. See ACCOUNTS-AND-REMINDERS.md for the schema, exports, security controls and operating requirements.
