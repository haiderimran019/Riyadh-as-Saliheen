# Riyad as-Salihin — Hadith Reader

A free and privacy-focused web application for reading and exploring **Riyad as-Salihin**. The project provides Arabic hadith, English translations, search, bookmarks, reading progress, daily Islamic content, and a responsive multilingual interface.

## Links

- [Live Website](https://haiderimran019.github.io/Riyadh-as-Saliheen/)
- [GitHub Repository](https://github.com/haiderimran019/Riyadh-as-Saliheen)

## Project Overview

This project was built to make Riyad as-Salihin easier to read through a clean and modern interface.

The app is completely free to use and includes no ads, analytics, tracking scripts, user accounts, or advertising cookies.

The current collection includes:

- 364 chapters
- 1,892 Arabic hadith entries
- 1,873 English translations

Religious text is displayed from published sources and is not generated or rewritten by the application.

## Key Features

### Hadith Reading

- Arabic hadith text
- English translations
- Chapter-based browsing
- Previous and next chapter navigation
- Reading progress tracking

### Search and Discovery

- Arabic and English search
- Chapter finder
- Topic-based discovery
- Daily hadith and Quran verse sections

### Bookmarks

- Save hadith
- Organize bookmarks into folders
- Data stored locally in the browser

### Multilingual Interface

- English interface
- Urdu interface
- Right-to-left Urdu layout
- Responsive Arabic and Urdu typography

### Privacy

- No accounts
- No ads
- No analytics
- No tracking cookies
- Bookmarks and settings stay on the user's device

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Lucide React

### Data and Search

- MiniSearch
- Dexie
- IndexedDB
- Zod

### Testing and Deployment

- Vitest
- Playwright
- GitHub Actions
- GitHub Pages

## Data Sources

Riyad as-Salihin Arabic text and English translations are sourced from **IslamEnc / IslamHouse**.

Quran text and translations used in the daily verse section are sourced from **QuranEnc**.

See [`DATA_SOURCES.md`](DATA_SOURCES.md) for details.

## Run it locally

```bash
npm install
npm run dev
```

By default the dev server runs in **preview mode** with placeholder content, so you'll see a "Preview build" banner. To build with the real collection, as the live site does:

```bash
npm run data:import:riyad -- --languages=ar,en
npm run data:import:quran-day
VITE_DATA_MODE=real npm run dev
```

`npm run verify` runs type-checking, linting, unit tests, data validation, the production build and the Playwright layout checks.
