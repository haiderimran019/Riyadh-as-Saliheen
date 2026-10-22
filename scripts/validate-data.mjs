import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { normalizeArabicForMatching, MINIMUM_ARABIC_MATCH_LENGTH, URDU_MATCH_METHOD } from './riyad-urdu-matching.mjs'

if (process.env.VITE_DATA_MODE !== 'real') {
  console.log('Preview mode has no bundled hadith data; validation skipped.')
  process.exit(0)
}

const dataRoot = join(process.cwd(), 'data-local', 'generated')
const sha256 = (text) => createHash('sha256').update(text).digest('hex')
const metadataSchema = z.object({
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  contributor: z.string().min(1),
  contributorRole: z.enum(['editor', 'translator']),
  license: z.string().min(1),
  dateRetrieved: z.string().date(),
}).passthrough()
const manifestSchema = z.object({
  metadata: metadataSchema,
  collections: z.array(z.object({
    id: z.literal('riyad-as-salihin'),
    title: z.string().min(1),
    description: z.string().min(1),
    index: z.string().min(1),
  }).passthrough()).min(1),
}).passthrough()
const indexSchema = z.object({
  id: z.literal('riyad-as-salihin'),
  languages: z.array(z.string()),
  recordIds: z.array(z.string().min(1)).min(1),
  chapters: z.array(z.object({ id: z.string(), title: z.string().min(1), file: z.string().min(1), count: z.number().int().positive() }).passthrough()).min(300),
  metadata: metadataSchema,
  allFile: z.string().min(1),
}).passthrough()
const recordSchema = z.object({ id: z.string().min(1), number: z.string().min(1), chapterNumber: z.string().min(1), arabic: z.string().min(1), sourceName: z.string().min(1) }).passthrough()
const chapterSchema = z.object({ metadata: metadataSchema, records: z.array(recordSchema).min(1) }).passthrough()
const translationValueSchema = z.object({ text: z.string().min(1), language: z.string().optional(), raw: z.record(z.string(), z.unknown()).optional() }).passthrough()
const translationsSchema = z.object({ metadata: metadataSchema, translations: z.record(z.string(), translationValueSchema) }).passthrough()
const quranAyahSchema = z.object({
  id: z.string().min(1), sura: z.string(), aya: z.string(),
  arabic_text: z.string().min(1), translation: z.string().min(1), footnotes: z.string(),
})
const dailyQuranSchema = z.object({
  publisher: z.literal('QuranEnc.com'), sourceUrl: z.string().url(), apiUrl: z.string().url(), dateRetrieved: z.string().date(),
  translations: z.object({ en: z.object({ key: z.string().min(1), title: z.string().min(1), version: z.string().min(1), sourceUrl: z.string().url() }), ur: z.object({ key: z.string().min(1), title: z.string().min(1), version: z.string().min(1), sourceUrl: z.string().url() }) }),
  ayahs: z.array(z.object({ sura: z.number().int().positive(), aya: z.number().int().positive(), arabic_text: z.string().min(1), translations: z.object({ en: quranAyahSchema, ur: quranAyahSchema }) })).min(1),
})

async function loadJson(path, schema, label) {
  const source = await readFile(path, 'utf8')
  const value = JSON.parse(source)
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(`${label} does not match the local data schema: ${result.error.issues[0]?.message ?? 'invalid data'}`)
  return result.data
}

await access(dataRoot)
const manifest = await loadJson(join(dataRoot, 'collections.json'), manifestSchema, 'Collection manifest')
const index = await loadJson(join(dataRoot, manifest.collections[0].index), indexSchema, 'Riyad collection index')
if (index.chapters.some((chapter) => /^chapter\s+\d+$/iu.test(chapter.title))) throw new Error('A chapter is missing its published English or Arabic title.')
let recordCount = 0
const translationCounts = Object.fromEntries(index.languages.map((language) => [language, 0]))
const translationsByLanguage = Object.fromEntries(index.languages.map((language) => [language, new Map()]))
const seenIds = new Set()

for (const chapter of index.chapters) {
  const chapterPath = join(dataRoot, index.id, chapter.file)
  const dataset = await loadJson(chapterPath, chapterSchema, `Chapter ${chapter.id}`)
  if (dataset.records.length !== chapter.count) throw new Error(`Chapter ${chapter.id} count mismatch.`)
  for (const record of dataset.records) {
    if (seenIds.has(record.id)) throw new Error(`Duplicate Riyad hadith ID ${record.id}.`)
    seenIds.add(record.id)
    recordCount++
    const sourceReference = record.arabic.match(/^\s*(\d+)\s*\/\s*(\d+)\s*[-–—ـ]/u)
    if (!sourceReference || Number(sourceReference[1]) !== Number(record.chapterNumber) || Number(sourceReference[2]) !== Number(record.number)) throw new Error(`Arabic source reference mismatch for hadith ${record.id}.`)
  }

  for (const language of index.languages) {
    const translationPath = join(dataRoot, 'translations', language, index.id, chapter.file)
    const translations = await loadJson(translationPath, translationsSchema, `${language} chapter ${chapter.id}`)
    if (language === 'ur' && (translations.metadata.sourceName !== 'HadeethEnc.com' || !translations.metadata.version)) throw new Error('Urdu source and translation version must be identified.')
    for (const [id, value] of Object.entries(translations.translations)) {
      if (!dataset.records.some((record) => record.id === id)) throw new Error(`Unmatched ${language} translation ${id}.`)
      const record = dataset.records.find((candidate) => candidate.id === id)
      if (language === 'en' && (!record || !value.text.match(new RegExp(`^0*${record.number}\\s*/\\s*\\d+\\s*[-–—ـ]`)))) throw new Error(`English source reference mismatch for hadith ${id}.`)
      if (language === 'ur') {
        const sourceArabic = typeof value.raw?.hadeeth_ar === 'string' ? normalizeArabicForMatching(value.raw.hadeeth_ar) : ''
        if (value.language !== 'ur' || value.text !== value.raw?.hadeeth || sourceArabic.length < MINIMUM_ARABIC_MATCH_LENGTH || !normalizeArabicForMatching(record.arabic).includes(sourceArabic)) throw new Error(`Urdu wording or source match failed for hadith ${id}.`)
        if (value.match?.method !== URDU_MATCH_METHOD || value.match.hadeethEncId !== value.raw.id || value.match.riyadId !== id || value.match.sourceArabicSha256 !== sha256(value.raw.hadeeth_ar) || value.match.riyadArabicSha256 !== sha256(record.arabic) || value.match.urduTextSha256 !== sha256(value.text)) throw new Error(`Urdu provenance evidence mismatch for hadith ${id}.`)
      }
      translationCounts[language]++
      translationsByLanguage[language].set(id, value)
    }
  }
}

if (seenIds.size !== index.recordIds.length || index.recordIds.some((id) => !seenIds.has(id))) throw new Error('Collection index record IDs do not match its chapter files.')
const all = await loadJson(join(dataRoot, index.id, index.allFile), chapterSchema, 'All Riyad records')
if (all.records.length !== recordCount) throw new Error('All-records file count mismatch.')
for (const language of index.languages) {
  const translated = await loadJson(join(dataRoot, 'translations', language, index.id, 'all.json'), translationsSchema, `All ${language} translations`)
  if (Object.keys(translated.translations).length !== translationCounts[language]) throw new Error(`${language} search index count mismatch.`)
  for (const [id, value] of Object.entries(translated.translations)) {
    const chapterValue = translationsByLanguage[language].get(id)
    if (!seenIds.has(id) || !chapterValue || JSON.stringify(value) !== JSON.stringify(chapterValue)) throw new Error(`${language} search index differs from its chapter file for ${id}.`)
  }
  if (index.languageCounts?.[language] !== undefined && index.languageCounts[language] !== translationCounts[language]) throw new Error(`${language} advertised coverage does not match its files.`)
}
if (index.languages.includes('ur')) {
  const sources = JSON.parse(await readFile(join(dataRoot, 'sources.json'), 'utf8'))
  const urduCredit = sources.sources.find((source) => source.collection === index.id && source.kind === 'translation' && source.language === 'ur')
  if (urduCredit?.metadata?.sourceName !== 'HadeethEnc.com' || !urduCredit.metadata.version) throw new Error('Urdu translation source credit is missing.')
}
const dailyQuran = await loadJson(join(dataRoot, 'quran-of-day.json'), dailyQuranSchema, 'QuranEnc daily ayah data')
for (const ayah of dailyQuran.ayahs) {
  for (const language of ['en', 'ur']) {
    const translated = ayah.translations[language]
    if (Number(translated.sura) !== ayah.sura || Number(translated.aya) !== ayah.aya || translated.arabic_text !== ayah.arabic_text) {
      throw new Error(`QuranEnc ${language} translation reference mismatch for ${ayah.sura}:${ayah.aya}.`)
    }
  }
}
console.log(`Validated Riyad: ${recordCount} Arabic hadith, ${translationCounts.en ?? 0} English translations, ${translationCounts.ur ?? 0} Urdu matching narrations across ${index.chapters.length} chapters.`)
console.log(`Validated QuranEnc daily ayah data: ${dailyQuran.ayahs.length} references with English and Urdu translations.`)
