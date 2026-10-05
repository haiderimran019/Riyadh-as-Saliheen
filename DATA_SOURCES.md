# Data sources

## Riyad as-Salihin

Arabic text, English translation, and chapter headings were retrieved from the published IslamEnc Riyad collection on 2026-10-04. The source presents paired Arabic and English editions; see [IslamEnc Riyad](https://riyadh.islamenc.com/en) and the [IslamHouse API Hub content policy](https://github.com/IslamHouse-API/multilingual-quran-hadith-islamic-content-database-api-hub#content-usage-policy).

The imported source text is retained as published, including its numbering. The importer pairs languages by the source's global hadith reference. No text is generated or inferred. The interface presents the reference number separately from the body and may reflow lines for reading. The edition provides no grade data in this import, so the app labels grades unavailable rather than inferring them.

| Language | Source entries | Included and paired |
| --- | ---: | ---: |
| Arabic | 1,892 | 1,892 |
| English | 1,879 | 1,873 |

There are 19 Arabic narrations with no paired English entry and 6 English entries without a matching Arabic reference; the latter are not included. The data index contains 364 chapters with at least one Arabic narration. Eight source headings with no parsed Arabic narrations are omitted from browsing. Raw source pages and generated records remain in ignored `data-local`; none are committed. Each import records its retrieval date in generated metadata.

The English text is displayed as published and is not reviewed by this app's team. The app makes no source requests at runtime. A real-data build includes the locally generated files in its output for offline reading.

## Ayah of the day

The daily Quran Arabic text and selected English and Urdu translations are retrieved from the official [QuranEnc API](https://quranenc.com/ar/home/api/) at build time, with the publisher's [content-use terms](https://quranenc.com/ur/home) observed. The imported wording, Arabic text, translation notes, and footnotes are retained exactly as received. Each build records the API edition key, version, source URL, and retrieval date. The selection rotates locally by date from six fixed references; the generated dataset is bundled for offline use, so the app does not contact QuranEnc at runtime. Raw responses and generated text remain under ignored `data-local` and are not committed.

The application interface is available in English and Urdu. Riyad as-Salihin's imported edition has Arabic and English only; it has no verified Urdu translation in this release. Urdu mode does not present English as Urdu. A suitable rights-cleared Urdu edition can be added later without changing the existing source text.

## Code and content

The MIT license covers code only. Hadith content is not covered by the code license and remains subject to the source's reuse policy. Keep visible attribution to IslamHouse.com / IslamEnc.com and preserve the source wording and reference numbering. Quran text and translations remain subject to QuranEnc.com's terms and are separately credited.
