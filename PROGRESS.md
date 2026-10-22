# Progress

- [x] Riyad as-Salihin Arabic and English: 364 chapters, 1,892 Arabic hadith, 1,873 English translations; 19 without paired English.
- [x] Carpet-inspired deep-green and warm-white redesign, custom Riyad mark/icons, self-hosted Newsreader/Manrope/Amiri/Nastaliq fonts, responsive desktop and phone layouts.
- [x] In-app reading, Arabic/English toggle, bilingual search, chapter finder, saved folders and deep links.
- [x] English/Urdu application interface, language selection in Settings, and Urdu right-to-left layout with a bundled Nastaliq font.
- [x] Urdu mobile refinement: safer RTL text wrapping, roomier Nastaliq leading, reduced hero ornament, and no clipped text/page overflow across 320–390px routes.
- [x] Daily Riyad hadith plus Quran ayah with Arabic and English/Urdu translations; selections advance every six hours and refresh while the app is open or resumed.
- [x] Bismillah Arabic calligraphy launch moment and app-wide iPhone/iPad adaptations: safe areas, system interface type, readable native controls, touch targets, persistent tabs, RTL and tablet widths.
- [x] Source credit retained; real/raw data remains in ignored `data-local` and is generated during the Pages workflow.
- [x] Replaced black with a Masjid Nabawi carpet-inspired green palette alongside warm white; removed visible offline promotion and made the 3-second Bismillah opening opaque and theme-aware.
- [x] Release checks: 13 unit tests and 43 browser checks passed, including iPhone/iPad typography and Urdu 320/360/390px overflow checks.
- [x] GitHub Pages deployment and public mobile reader verified with real Arabic and English data.
- [x] Mobile polish: compact English/Urdu control in Settings, named chapter fallbacks, and chapter-local hadith numbering; IslamEnc credit stays in the footer.
- [x] Home discovery: six Urdu/English everyday-life themes link directly to matching original chapters; reading progress and previous/next chapter controls support ongoing reading.
- [x] New visual edition: architectural Riyad hero, paired daily readings, topic-led discovery, and a compact chapter index; distinct responsive type, color, and surface system.
- [x] Chapter titles: importer now recognizes both dash- and period-numbered source headings; 362 chapters have English source titles and the remaining 2 retain Arabic source titles.
- [x] Compact bilingual footer: consistent internal padding, responsive source credits, readable metadata, expandable caution, and safe space above the floating tabs.
- [x] Final verification: lint, 18 unit tests, real-data Pages build, and all 41 responsive/theme checks across 320–1440px, including English/Urdu footer clearance and Library button contrast.
- [ ] This imported IslamEnc edition has no structured grades for its 1,892 records; obtaining an authoritative, rights-cleared grading dataset remains necessary. Grades are not inferred.
- [x] Partial published Urdu: 238 matching Riyad entries from 229 HadeethEnc narrations, v1.36.0; full raw records, strict matching evidence and source credit retained outside Git.
- [x] Urdu reading/search/daily cards load only the selected language; per-entry gaps stay Arabic, with matching-source Arabic available for comparison.
- [ ] Full Urdu edition still incomplete: 1,654 entries lack imported Urdu; book scans need reuse clearance and verified transcription, and Islam360 prohibits data export/republication.
- [ ] Urdu release validation and GitHub Pages publish in progress.
- [ ] Full Lighthouse and screenshot matrix deferred.


## 22 October 2026 connected reading release

- [x] Approved botanical reading workspace; home composition and base CSS preserved while adding server data initialization.
- [x] Distinct Hadith/Quran navigation icons and safe-area floating phone navigation.
- [x] Complete Quran reader: 114 surahs, 6,236 ayahs, English toggle and preserved QuranEnc notes/edition attribution.
- [x] GPS/city prayer calculations with selectable methods, timezone and Asr school.
- [x] Verified email authentication, private SQLite persistence, consented approximate locations, user export/deletion and owner-only CSV/JSON dashboard.
- [x] Durable opt-in hadith, ayah and prayer push scheduling; daily hadith and ayah exactly five elapsed hours apart, with supported-device vibration.
- [x] Same-component React SSR, route metadata, canonical URLs, structured data, public reading sitemap, private noindex and real 404s.
- [x] Production security headers, request validation/throttling, cookie/origin controls, private-file isolation and zero npm audit advisories at installation.
- [x] Final installed-repository build, 26 unit tests, 4 isolated backend/scheduler tests and 2 production SSR/security tests passed. Direct development renderer checks passed for five key routes.
- [ ] Final visual browser rerun blocked by a saved browser permission policy. Earlier responsive checks preceded the SSR changes and are not a final release gate.
- [ ] Public deployment, production SMTP and Google OAuth credentials are not configured. Local email verification uses a private outbox.
- [ ] Physical notification/vibration delivery requires validation on the target deployment and device. Keep the backend running for reminders.

See docs/ACCOUNTS-AND-REMINDERS.md for owner onboarding, private data access, configuration and deployment requirements. Earlier progress entries describe historical releases and do not imply that this new backend is hosted on GitHub Pages.
