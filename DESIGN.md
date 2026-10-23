# Riyad reading workspace

A complete replacement of the incumbent dark hero, horizontal navigation, floating mobile tabs, interstitial splash, stacked reader and single-book library intermediary.

The new structure uses a permanent olive navigation rail on desktop, a compact icon rail on tablet, and a deliberate menu on phones. The library opens directly into a searchable chapter catalogue. Reading opens one narration at a time, with direct fragment links, previous/next narration, a hadith selector, a searchable chapter drawer, Arabic/translation layouts, and focus mode.

## Visual system
Warm paper #f8f6f0, olive ink #353b31, sage controls #526347, light oat #edeadc, and an olive #303b2f rail. Night mode changes the reading canvas and preserves contrast. Newsreader supplies the literary voice; Manrope handles UI. Amiri and Noto Nastaliq Urdu are bundled script-specific faces. Body text has calm, limited measures. Source metadata is smaller than the reading text. Borders mark changes of context; groups are separated with space. The original garden illustration is decorative and contains no manuscript text.

## Research and decisions
- [Quran.com](https://quran.com/): prominent search, clear chapter entry and language access.
- [Tarteel Adaptive Mode](https://tarteel.ai/blog/tarteel-ai-adaptive-mode/): adjustable Arabic sizing, accessible reading layouts and translation alongside Arabic.
- [Sunnah.com Riyad](https://sunnah.com/riyadussalihin): reliable reference numbering and explicit collection wayfinding. No content was imported from this reference.
- [Readwise Reader](https://readwise.io/read): persistent workspace navigation, focused reading and a purposeful saved collection.

These are studied examples, not an objective global ranking. All source religious text remains from the repository's existing licensed datasets.

## Direction reasoning
Seven grounded candidates were considered: scholarly folio, garden atlas, courtyard wayfinding, contemporary bookshop, library catalogue, botanical reading desk, and manuscript margins. The selected direction is the botanical reading desk: an illustrated garden gives the collection an identity; the reading surface remains quiet. The design helper assigned candidate six (seed:a7cacebfe9d08cc7). Museum provenance and tab-board challengers reinforced visible citations and direct wayfinding; fashion and instrument metaphors were declined because their forms would obscure the reading task. The user delegated the design choice and requested the implemented localhost result.

## Interaction and accessibility
Keep source wording and provenance exact. Do not fill translation gaps. Urdu matching narrations retain their qualification and source Arabic. Support RTL, keyboard focus, reduced motion, local saved folders and progress, display preferences and errors. Phone navigation is inert while closed and contains focus when open. Reader focus mode always retains its exit control.

## Connected reading extension
The user approved the home design and requested that it remain. Quran, prayer times, accounts, owner data and reminders inherit the same paper, olive, typography and spacing. Phones gain a five-item floating bottom menu with safe-area spacing and reading settings behind the More button. The top-left menu remains the navigation drawer; account access lives there, leaving language controls alone in the header. The footer keeps only compact links, with caution and edition information on About. Quran pages contain 20 complete ayahs, per-ayah bookmarks and automatic reading position; Saved passages resumes both readers directly. Hadith uses an open-book icon; Quran uses a closed, bookmarked book. GPS, saved location and notifications are separate choices, with permissions requested only on explicit actions. The SSR renderer uses the same React page components and changes initial loading/data delivery without redesigning the home composition.

## 23 October daily overview release
User explicitly superseded the previous preserved-home and optional-account constraints: Google sign-in is now required, with optional, separately consented usage analytics and latest precise GPS. Extend the botanical reading world into a daily almanac, an Operate surface: panoramic courtyard, one current-prayer panel, immediate Quran/hadith continuation and complete daily source readings. Preserve the paper, olive, Newsreader/Amiri identity. Phones put current prayer and both reading paths before full text. Quran More owns edition, Uthmani/actual IndoPak and Mushaf/verse choices. A single native language menu supports English, Urdu, Bengali and Arabic.
Research: Quran.com reading settings and Tarteel translation/bookmark flows informed direct continuation and grouped reading tools; Pillars informed the single-prayer focus and coordinate-based device calculations. These are design references, not a claim of a globally ranked best interface.
