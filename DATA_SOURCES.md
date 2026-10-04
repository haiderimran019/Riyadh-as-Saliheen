# Data sources

## HadeethEnc content

Stage 5a uses the official HadeethEnc API at `https://hadeethenc.com/api/v1` for Arabic, English, Urdu, Bengali, and Hindi. It was retrieved on 2026-10-04. Raw responses and generated data remain in the ignored `data-local` directory and are never committed; deployment builds fetch data into their temporary workspace before building.

HadeethEnc's stated reuse terms require that content is not modified, added to, or deleted from, and that HadeethEnc.com is clearly credited as publisher and source. The importer caches every response and preserves each complete API record alongside the normalized fields used by the interface.

The local stage report records exact hadith counts, byte sizes, missing translations, and every distinct grade label with its count, separated by language. English returned 26 distinct grade labels; Arabic returned 46; Urdu returned 27; Bengali returned 24; Hindi returned 26. Grade labels are shown exactly as received and identified as “per HadeethEnc.”

The app fetches no HadeethEnc data at runtime. A build copies the retrieved dataset into the static output. The fetch script supports later language stages through `--languages=code,code`; stage 5b was not run. Do not edit, shorten, combine, augment, or remove any HadeethEnc content field. Each hadith view and share card must visibly credit HadeethEnc.com.

The distinct grade labels (with counts per language) are recorded in the local `data-local/report.json` output. Current distinct label totals: English 26, Arabic 46, Urdu 27, Bengali 24, Hindi 26.

## Riyad as-Salihin

This collection is not bundled. The identified public dataset does not clearly grant redistribution rights for the English translation; see [DATA_LICENSE.md](https://github.com/Jaguar16/open-hadith-data/blob/main/DATA_LICENSE.md), which points English translation users to Sunnah.com's terms. Until the specific Arabic and translation rights are confirmed, Riyad as-Salihin remains “Coming soon.”
