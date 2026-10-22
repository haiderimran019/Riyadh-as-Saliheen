import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchPublishedUrduNarration, MINIMUM_ARABIC_MATCH_LENGTH, URDU_MATCH_METHOD } from './riyad-urdu-matching.mjs'

const root = process.cwd()
const collectionId = 'riyad-as-salihin'
const outputRoot = join(root, 'data-local', 'generated')
const rawRoot = join(root, 'data-local', 'raw', 'riyad-urdu')
const apiUrl = 'https://hadeethenc.com/api/v1'
const versionUrl = 'https://hadeethenc.com/browse/download/ur'
const retrieved = new Date().toISOString().slice(0, 10)
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const sha256 = (text) => createHash('sha256').update(text).digest('hex')
const allowlist = JSON.parse(await readFile(fileURLToPath(new URL('./riyad-urdu-allowlist.json', import.meta.url)), 'utf8'))

if (allowlist.method !== URDU_MATCH_METHOD || allowlist.minimumArabicLength !== MINIMUM_ARABIC_MATCH_LENGTH) throw new Error('Urdu mapping review uses a different matching method.')

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value))
}

async function readCachedJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function request(url, { method = 'GET', asJson = true } = {}) {
  let failure
  for (let attempt = 0; attempt < 5; attempt++) {
    await delay(350 + attempt * 250)
    try {
      const response = await fetch(url, {
        method,
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: asJson ? 'application/json' : '*/*', 'User-Agent': 'Riyad-as-Saliheen-reader/0.2 Urdu source import' },
      })
      if (!response.ok) {
        if (response.status !== 429 && response.status < 500) throw Object.assign(new Error(`HadeethEnc returned HTTP ${response.status} for ${url}`), { retryable: false })
        throw new Error(`HadeethEnc returned HTTP ${response.status} for ${url}`)
      }
      if (!asJson) {
        await response.body?.cancel()
        return { url: response.url, status: response.status }
      }
      return await response.json()
    } catch (error) {
      failure = error
      if (error.retryable === false) throw error
      if (attempt < 4) await delay(700 * (2 ** attempt))
    }
  }
  throw failure
}

// The official download redirect identifies the current translation edition.
// HEAD avoids downloading the workbook; an API schema version is not a
// translation edition number and must not be used as one.
const editionResponse = await request(versionUrl, { method: 'HEAD', asJson: false })
const version = decodeURIComponent(new URL(editionResponse.url).pathname).match(/HadeethEnc\.com_ur-(v\d+\.\d+\.\d+)\.xlsx$/iu)?.[1]
if (!version) throw new Error('The official Urdu download did not identify a translation version.')
const edition = { language: 'ur', version, versionUrl, downloadUrl: editionResponse.url, dateChecked: retrieved }
await writeJson(join(rawRoot, 'edition.json'), edition)

const indexPath = join(outputRoot, collectionId, 'index.json')
const index = JSON.parse(await readFile(indexPath, 'utf8'))
const arabic = JSON.parse(await readFile(join(outputRoot, collectionId, index.allFile), 'utf8'))
const arabicById = new Map(arabic.records.map((record) => [record.id, record]))
if (arabicById.size !== arabic.records.length) throw new Error('Duplicate Riyad IDs prevent a verified Urdu import.')
const sourceIds = [...new Set(Object.values(allowlist.pairs))].sort((left, right) => Number(left) - Number(right))
const batches = Array.from({ length: Math.ceil(sourceIds.length / 25) }, (_, position) => sourceIds.slice(position * 25, position * 25 + 25))
const responses = new Array(batches.length)
let nextBatch = 0
let fetchedBatches = 0

async function worker() {
  while (nextBatch < batches.length) {
    const position = nextBatch++
    const ids = batches[position]
    const url = `${apiUrl}/hadeeths/multiple/?language=ur&ids=${ids.join(',')}`
    const cachePath = join(rawRoot, version, `${sha256(url).slice(0, 20)}.json`)
    const cached = await readCachedJson(cachePath)
    // Preserve each retrieval date and refresh yesterday's API content even
    // when the download edition number has not changed.
    if (cached?.dateRetrieved === retrieved && cached.version === version && cached.url === url && Array.isArray(cached.records)) {
      responses[position] = cached.records
    } else {
      const records = await request(url)
      if (!Array.isArray(records)) throw new Error('The official Urdu API returned an unexpected response.')
      const requestedIds = new Set(ids)
      if (records.some((record) => !requestedIds.has(record.id))) throw new Error('The Urdu API returned an unrequested source ID.')
      await writeJson(cachePath, { url, version, dateRetrieved: retrieved, records })
      responses[position] = records
      fetchedBatches++
    }
  }
}
await Promise.all([worker(), worker()])

const candidates = responses.flat()
const allTranslations = {}
const rejected = []
const evidence = []
for (const [riyadId, expectedSourceId] of Object.entries(allowlist.pairs)) {
  const record = arabicById.get(riyadId)
  if (!record) {
    rejected.push({ riyadId, expectedSourceId, reason: 'missing-arabic-entry' })
    continue
  }
  const match = matchPublishedUrduNarration(record, candidates)
  if (match.status !== 'accepted' || match.raw.id !== expectedSourceId) {
    rejected.push({ riyadId, expectedSourceId, reason: match.status === 'accepted' ? 'mapping-changed' : match.status, candidateIds: match.status === 'accepted' ? [match.raw.id] : match.candidateIds })
    continue
  }
  const sourceUrl = `https://hadeethenc.com/ur/browse/hadith/${match.raw.id}`
  const audit = {
    ...match.evidence,
    riyadId,
    sourceArabicSha256: sha256(match.raw.hadeeth_ar),
    riyadArabicSha256: sha256(record.arabic),
    urduTextSha256: sha256(match.raw.hadeeth),
  }
  allTranslations[riyadId] = { text: match.raw.hadeeth, language: 'ur', raw: match.raw, sourceUrl, match: audit }
  evidence.push(audit)
}

const accepted = Object.keys(allTranslations).length
if (accepted === 0) throw new Error('No allowlisted Urdu narrations still match the published Riyad Arabic text.')
const metadata = {
  sourceName: 'HadeethEnc.com',
  sourceUrl: 'https://hadeethenc.com/ur/home',
  contributor: 'HadeethEnc editorial translation team',
  contributorRole: 'translator',
  license: 'HadeethEnc terms permit republication with unchanged content, publisher attribution, translation version and transcript information; keep current with publisher updates. https://hadeethenc.com/ur/home',
  dateRetrieved: retrieved,
  version,
  versionUrl,
  downloadUrl: edition.downloadUrl,
  scope: 'matching-narrations',
  coverage: 'partial',
  matchingMethod: URDU_MATCH_METHOD,
}

const translationRoot = join(outputRoot, 'translations', 'ur', collectionId)
for (const chapter of index.chapters) {
  const dataset = JSON.parse(await readFile(join(outputRoot, collectionId, chapter.file), 'utf8'))
  const translations = Object.fromEntries(dataset.records.filter((record) => allTranslations[record.id]).map((record) => [record.id, allTranslations[record.id]]))
  await writeJson(join(translationRoot, chapter.file), { metadata, translations })
}
await writeJson(join(translationRoot, 'all.json'), { metadata, translations: allTranslations })
await writeJson(indexPath, {
  ...index,
  languages: [...new Set([...index.languages, 'ur'])],
  languageNames: { ...index.languageNames, ur: 'اردو' },
  languageCounts: { ...index.languageCounts, ur: accepted },
})
const sourcesPath = join(outputRoot, 'sources.json')
const sources = JSON.parse(await readFile(sourcesPath, 'utf8'))
await writeJson(sourcesPath, {
  ...sources,
  sources: [...sources.sources.filter((source) => !(source.collection === collectionId && source.kind === 'translation' && source.language === 'ur')), { collection: collectionId, kind: 'translation', language: 'ur', metadata }],
})

const report = {
  collection: collectionId,
  scope: 'matching-narrations',
  edition,
  matchingMethod: URDU_MATCH_METHOD,
  normalization: 'NFKC; remove Arabic diacritics, Quranic marks, tatweel, spacing and punctuation; fold alef variants and alif maqsura to ya.',
  minimumArabicLength: MINIMUM_ARABIC_MATCH_LENGTH,
  arabicEntries: arabic.records.length,
  allowlisted: Object.keys(allowlist.pairs).length,
  sourceRecords: candidates.length,
  fetchedBatches,
  accepted,
  missing: arabic.records.length - accepted,
  ambiguous: rejected.filter((value) => value.reason === 'ambiguous').length,
  rejected,
  evidence,
}
await writeJson(join(root, 'data-local', 'riyad-urdu-report.json'), report)
console.log(`Imported ${accepted} unchanged HadeethEnc Urdu matching narrations (${version}); ${report.missing} Riyad entries have no imported Urdu. Ambiguous mappings rejected: ${report.ambiguous}.`)
