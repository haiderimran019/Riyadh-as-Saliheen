# Architecture guide

## Boundaries

- `src/core` contains app-wide events and behavior that is not owned by a screen.
- `src/data` contains the repository contract, source adapters, cache, and local storage.
- `src/features/registry.tsx` is the single route and navigation registry. Screen modules are loaded lazily from `src/pages`.
- `src/ui` contains shared navigation and layout UI; screen-specific UI stays beside its screen until it is shared.
- `src/styles.css` contains design tokens, themes, and responsive component styles.

Features should depend on core, data, and shared UI, but not import another feature directly. `npm run lint` checks cross-feature imports.

## Data access

Pages call `HadithRepository`; the current `HadeethEncJsonAdapter` reads the build-generated static JSON through the shared loader. A new collection source should implement the adapter interface instead of teaching a page where files or endpoints live. API retrieval belongs only in the build-time import script.

## Adding a feature

1. Add a focused screen module and tests.
2. Register its route and, if it belongs in primary navigation, add its navigation entry in `src/features/registry.tsx`.
3. Keep reusable controls in `src/ui`; keep source and persistence logic in `src/data`.
4. Run `npm run verify` and ensure feature code does not import another feature.
