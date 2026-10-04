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

## Code and content

The MIT license covers code only. Hadith content is not covered by the code license and remains subject to the source's reuse policy. Keep visible attribution to IslamHouse.com / IslamEnc.com and preserve the source wording and reference numbering.
