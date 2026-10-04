# Progress

## Current milestone: M1 Foundation — complete

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

### Next

- M2 Reader: collection, chapter, and hadith reading views; typography and reader controls.

### Known issues

- Real content is blocked on source/translation licensing and provenance verification.
- Offline service worker is scheduled for M5.
