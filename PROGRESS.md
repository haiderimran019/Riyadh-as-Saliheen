# Progress

## Current milestone: M3 Search and saving — complete

### Done

- Created a Vite + React + TypeScript application with React Router dependencies.
- Added a small CSS-variable design-token system and light, dark, and sepia themes.
- Added an Arabic-first normalized schema: Arabic is required, while translations are optional, independent datasets.
- Added metadata blocks for every Arabic and translation dataset (source, URL, contributor role, licence, retrieval date).
- Added a generic build-time import script that emits a collection manifest, per-collection index, one Arabic JSON file per chapter, and independent translation chapter files by language.
- Added a cached static JSON data loader.
- Added a quarantined fawazahmed0-format adapter; raw and adapted real-data folders are Git-ignored until licensing is cleared.
- Self-hosted the Amiri font package; no font request is made at runtime.
- Documented the candidate dataset and unresolved translation licensing.
- Added only conspicuously fake placeholder content. No real hadith text or metadata is shipped.

### M2 done

- Added collection, chapter, and chapter-reader routes.
- Added Arabic-first cards with RTL direction, self-hosted Amiri, generous line height, a tashkeel toggle, and font-size controls.
- Translations load from independent per-language chapter files and disappear cleanly when unavailable.
- Displayed translation provenance and licence next to every visible translation.
- Added a Sources & credits page generated from dataset metadata.
- Displayed collection, book, chapter, number, and either attributed grades or “Grade not available” on every card.

### M3 done

- Added MiniSearch client-side search that works from Arabic records alone.
- Added Arabic normalization for tashkeel, tatweel, alef, ya, ta marbuta, waw-hamza, and ya-hamza variants.
- Added IndexedDB bookmarks with optional on-device folders.
- Added intersection-based last-read position and a resume link on the collection page.
- Persisted reader text size, tashkeel, and theme settings on-device.
- Added settings, search, and saved routes with mobile navigation.
- Added Vitest coverage for Arabic search normalization.

### Next

- M4 Trust UI: explained grade badges, trust filters, grading/reference details, and desktop three-pane layout.

### Known issues

- Real content is blocked on source/translation licensing and provenance verification.
- Offline service worker is scheduled for M5.
