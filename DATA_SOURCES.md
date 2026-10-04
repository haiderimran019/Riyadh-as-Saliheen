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

## Candidate source under review

- Repository: `fawazahmed0/hadith-api`
- Repository license: The Unlicense
- Repository URL: https://github.com/fawazahmed0/hadith-api
- Candidate collections: Forty Hadith of an-Nawawi, then Riyad as-Salihin
- Status: **not imported**
- Licensing concern: the repository-level license is permissive, but that does not by itself prove that each included translation was relicensed by its translator or original publisher. English translation provenance and rights are not sufficiently clear for this app yet.
- Runtime policy: if approved content is imported later, it will be copied into `public/data`; the app will never fetch from this or any other third-party service at runtime.

Before real content is added, record the exact source file and revision, retrieval date, translator, grader for each grade, applicable license, and any attribution requirements here.

## Import quarantine

`scripts/adapters/fawazahmed0.mjs` converts downloaded editions into the app's Arabic-first staging format. Its output is written to `scripts/source-data/real/`, which is ignored by Git. Raw downloads belong in `scripts/raw-data/`, also ignored. The adapter deliberately emits `[REQUIRED ...]` metadata fields; a file must not be moved into the tracked source list until every field is verified and this document is updated.
