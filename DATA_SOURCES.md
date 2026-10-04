# Data sources

## Shipped content

The app currently ships **no real hadith content**. Every Arabic record and translation under `scripts/source-data` is conspicuously fake and marked with `[PLACEHOLDER ...]`. They exist only to exercise the import, reading, search, bookmarking, and offline interfaces.

| Field | Current value |
| --- | --- |
| Source | Locally created fake placeholder records |
| Translator | `Placeholder only` |
| Grader | None |
| License | CC0-1.0 for these fake records |

The Arabic placeholder file and the English placeholder file each carry their own metadata block. Generated chapter files preserve that block.

## Real content source

Stage 5a uses the official HadeethEnc API at `https://hadeethenc.com/api/v1` for Arabic, English, Urdu, Bengali, and Hindi. It was retrieved on 2026-10-04. Raw responses and generated real data remain in the ignored `data-local` directory and are never committed.

HadeethEnc's stated reuse terms require that content is not modified, added to, or deleted from, and that HadeethEnc.com is clearly credited as publisher and source. The importer caches every response and preserves each complete API record alongside the normalized fields used by the interface.

The local stage report records exact hadith counts, byte sizes, missing translations, and every distinct grade label with its count, separated by language. English returned 26 distinct grade labels; Arabic returned 46; Urdu returned 27; Bengali returned 24; Hindi returned 26. Grade labels are shown exactly as received and identified as “per HadeethEnc.”

The app fetches no HadeethEnc data at runtime. A real-mode build copies the already retrieved local dataset into the static output. The fetch script supports later language stages through `--languages=code,code`; stage 5b was not run.
