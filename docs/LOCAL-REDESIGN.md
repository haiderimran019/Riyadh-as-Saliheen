# Local reading workspace

Run `npm run dev:reader` and open <http://127.0.0.1:5173/>. This uses the existing real local dataset and serves the redesigned UI directly from this repository. Stop the server with Ctrl+C.

The reader requires `data-local/generated`, already present in this checkout. A fresh clone needs the repository's documented data import. The UI never substitutes generated religious text for missing source material.

The redesign replaces the global navigation, home composition, library flow, chapter catalogue, search presentation, saved collection, reading flow, settings presentation and source/legal pages. See DESIGN.md for visual decisions and research references.

The local dataset validates 1,892 Arabic records, 1,873 English translations, 238 Urdu matching narrations, 364 chapters, and six daily Quran references with English and Urdu translations. Urdu is a partial matching-narration edition and its qualification remains visible.

## Artwork
`public/images/reading-garden.png` was generated with the built-in ImageGen tool for this redesign. It is decorative original garden artwork and contains no religious manuscript text.

Prompt: A sophisticated botanical gouache illustration of a peaceful walled garden seen from a shaded veranda. A pale sandstone arch frames an olive tree, cypresses, jasmine, terracotta planters and a narrow turquoise water channel, with distant hills. A closed, unmarked ivory book rests on a stone ledge. Muted sage, olive, limestone cream, terracotta and ochre sunlight; a refined adult literary illustration. No people, text, calligraphy, logos, UI or watermarks.

## Verification
Run `npm run typecheck`, `npm run lint`, `npm test`, then `VITE_DATA_MODE=real VITE_BASE_PATH=/ npm run build`. With the real local server running, run `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173/ npx playwright test`. Optional `RIYAD_SCREENSHOT_DIR` sets the preview image output directory; otherwise screenshots are written to `screenshots/redesign`.

Browser coverage includes 320, 360, 390, 768, 1024 and 1440 pixel layouts; English and Urdu routes; source-text preservation; translation gaps; search; saved folders; copy attribution; chapter pagination; single-narration navigation; fragment restoration; display modes; focus mode; and mobile keyboard navigation.
