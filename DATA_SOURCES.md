# Data sources

## Riyad as-Salihin

Arabic text, English translation, and chapter headings were retrieved from the published IslamEnc Riyad collection on 2026-10-04. The source presents paired Arabic and English editions; see [IslamEnc Riyad](https://riyadh.islamenc.com/en) and the [IslamHouse API Hub content policy](https://github.com/IslamHouse-API/multilingual-quran-hadith-islamic-content-database-api-hub#content-usage-policy).

The imported source text is retained as published, including both its chapter-local and collection-wide numbering. The importer pairs languages by the source's global hadith reference; reading views use the chapter-local number, while shared cards retain the source reference. No text or grade is generated or inferred. This edition provides no grade data in this import, so the app labels grades as not supplied rather than inventing them.

| Language | Source entries | Included and paired |
| --- | ---: | ---: |
| Arabic | 1,892 | 1,892 |
| English | 1,879 | 1,873 |

There are 19 Arabic narrations with no paired English entry and 6 English entries without a matching Arabic reference; the latter are not included. The data index contains 364 chapters with at least one Arabic narration. Eight source headings with no parsed Arabic narrations are omitted from browsing. Raw source pages and generated records remain in ignored `data-local`; none are committed. Each import records its retrieval date in generated metadata.

The English text is displayed as published and is not reviewed by this app's team. The app makes no source requests at runtime. A real-data build serves its generated static files from the same website; the app requires internet access and does not register a service worker for offline reading.

## Ayah of the day

The daily Quran Arabic text and selected English and Urdu translations are retrieved from the official [QuranEnc API](https://quranenc.com/ar/home/api/) at build time, with the publisher's [content-use terms](https://quranenc.com/ur/home) observed. The imported wording, Arabic text, translation notes, and footnotes are retained exactly as received. Each build records the API edition key, version, source URL, and retrieval date. The selection rotates every six hours locally from six fixed references; its generated static file is served by the website, and the app requires internet access. Raw responses and generated records remain under ignored `data-local` and are not committed.

## Urdu matching narrations — partial coverage

On 2026-10-05, 238 Riyad entries were matched to 229 distinct published Urdu narrations from [HadeethEnc.com](https://hadeethenc.com/ur/home), edition **v1.36.0**. There are still 1,654 Riyad entries without an imported Urdu translation. This is not a complete Urdu translation of the book and is not represented as one. The official [Urdu download redirect](https://hadeethenc.com/browse/download/ur) identifies the edition; build-time API requests retrieve its current text.

`npm run data:import:urdu` runs after the Arabic/English importer. The tracked allowlist contains IDs only. Matching requires the complete normalized `hadeeth_ar` from the same Urdu source record to occur within the Riyad Arabic entry, with at least 80 normalized characters and no ambiguity among candidates. Normalization is used only for matching; stored and displayed source wording is not rewritten. Short, ambiguous or changed mappings are rejected. Collection-wide and chapter-local Riyad references are preserved; no grades are inferred.

Some Riyad entries contain additional variants or commentary not present in the matched narration. The app labels these translations **Urdu · matching narration**, explains that distinction, and provides the full corresponding HadeethEnc Arabic for comparison. The translated `hadeeth` field and the complete raw record are preserved exactly as received. Search, reading views, daily reading, copy and share use the selected language without mislabeling English as Urdu. These translations are not reviewed by this app’s team.

HadeethEnc’s published terms require unmodified content, visible publisher/source attribution, translation edition and source information, and keeping pace with source updates. The importer verifies the current official edition and fetches with at most two concurrent requests, delays, retries and a resumable versioned cache. Raw responses, generated language files and the coverage/hash audit report remain in ignored `data-local`; no real hadith text is committed.

Full published Urdu book scans were located, but they are not verified editable text and their edition notices do not establish unrestricted app redistribution. Islam360’s [terms](https://theislam360.com/terms-of-use.html) prohibit exporting and republishing its app data. Those sources are not imported; full coverage requires a verified, reusable Urdu edition, not machine-generated or unproofread OCR text.

The application interface is available in English and Urdu. Urdu mode keeps Arabic visible and explains individual missing translations. QuranEnc daily ayahs retain their separately sourced Urdu meanings.

## Code and content

The MIT license covers code only. Hadith content is not covered by the code license and remains subject to the source's reuse policy. Keep visible attribution to IslamHouse.com / IslamEnc.com and HadeethEnc.com and preserve their source wording and reference numbering. Quran text and translations remain subject to QuranEnc.com's terms and are separately credited.

## Complete Quran reader

The complete reader import on 2026-10-22 contains 114 surahs and 6,236 ayahs from the [QuranEnc API](https://quranenc.com/en/home/api/). The API key `english_saheeh` currently identifies the publisher's **English Translation - Noor International Center**, edition **1.1.2**; the UI uses that returned title rather than inferring a translator from the key. Arabic, translated wording, supplied footnotes and edition metadata are preserved. [Quran Foundation chapter metadata](https://api.quran.com/api/v4/chapters?language=en) supplies names, meanings and verse counts, which the importer checks against every fetched surah.

`npm run data:import:quran` refreshes the full source edition with bounded concurrency, delays and retry handling. Generated files and source metadata remain under ignored `data-local/generated/quran`. The app credits QuranEnc and displays its current edition version and supplied translation notes, in line with its reuse terms. The Node backend reads the imported data; ordinary reading does not call the publisher's API. Source content is not licensed under the code's MIT licence.

The service worker added in this release handles visible push notifications only. It does not cache reading content or provide offline reading. Public text is also rendered into initial HTML by the same React components used in the browser; account records and coordinates are not embedded in shared reading HTML.
