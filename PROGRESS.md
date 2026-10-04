# Progress

## Current milestone: M5 Offline and polish — complete

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

### M4 done

- Added icon, text, and semantic styling hooks for grade badges; grade labels never rely on colour alone.
- Added plain-language grade explanations attributed to the named grader and an honest missing-grade explanation.
- Added Sahih-only, Sahih+Hasan, and All trust filters. Records without grades appear only under All.
- Added grading, reference, and record-location details in a mobile bottom sheet and persistent desktop context pane.
- Added a true three-pane desktop reader: chapter browse, reading column, and context.

### M5 done

- Added an installable PWA manifest and Workbox service worker.
- Precached the app shell and self-hosted Arabic font; fetched chapter and translation JSON is stored in a cache-first on-device cache.
- Added a deterministic, Arabic-only-capable Hadith of the day.
- Added share-as-image generation with Arabic, optional credited translation, exact reference, and attributed grade or honest grade fallback.
- Added a browser install prompt when supported.
- Added skip navigation, explicit labels, focus treatment, reduced-motion handling, and keyboard-accessible controls.
- Added route-level code splitting and virtualization for chapters longer than 20 records.
- Switched Amiri imports to Arabic-only font subsets.
- Added Vitest coverage for data loading/cache paths and daily hadith selection.

### Next

- Optional M6 stretch: merge matched narrations and add a text-match-only verification page.

### Known issues

- Real content is blocked on source/translation licensing and provenance verification.
- The install prompt depends on browser install eligibility and is intentionally hidden otherwise.
- Share uses the native Web Share API when file sharing is supported and otherwise downloads the generated image.
- Lighthouse was not available in this environment, so the 90+ mobile target was optimized toward but not measured.
- M6 stretch work has not been started.
