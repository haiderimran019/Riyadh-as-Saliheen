import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

if (process.env.VITE_DATA_MODE !== 'real') {
  console.log('Preview mode has no bundled hadith data; validation skipped.')
  process.exit(0)
}

const dataRoot = join(process.cwd(), 'data-local', 'generated')
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
const recordSchema = z.object({ id: z.string().min(1), arabic: z.string().min(1), sourceName: z.string().min(1) }).passthrough()
const chapterSchema = z.object({ metadata: metadataSchema, records: z.array(recordSchema).min(1) }).passthrough()
const translationValueSchema = z.object({ text: z.string().min(1), language: z.string().optional(), raw: z.record(z.string(), z.unknown()).optional() })
const translationsSchema = z.object({ metadata: metadataSchema, translations: z.record(z.string(), translationValueSchema) }).passthrough()

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
let recordCount = 0
let translationCount = 0
const seenIds = new Set()

for (const chapter of index.chapters) {
  const chapterPath = join(dataRoot, index.id, chapter.file)
  const dataset = await loadJson(chapterPath, chapterSchema, `Chapter ${chapter.id}`)
  if (dataset.records.length !== chapter.count) throw new Error(`Chapter ${chapter.id} count mismatch.`)
  for (const record of dataset.records) {
    if (seenIds.has(record.id)) throw new Error(`Duplicate Riyad hadith ID ${record.id}.`)
    seenIds.add(record.id)
    recordCount++
    if (!record.arabic.match(new RegExp(`^\\d+\\s*/\\s*${record.number}\\s*[-–—ـ]`))) throw new Error(`Arabic source reference mismatch for hadith ${record.id}.`)
  }

  const language = 'en'
  if (index.languages.includes(language)) {
    const translationPath = join(dataRoot, 'translations', language, index.id, chapter.file)
    try { await access(translationPath) } catch { continue }
    const translations = await loadJson(translationPath, translationsSchema, `${language} chapter ${chapter.id}`)
    for (const [id, value] of Object.entries(translations.translations)) {
      if (!dataset.records.some((record) => record.id === id)) throw new Error(`Unmatched ${language} translation ${id}.`)
      const record = dataset.records.find((candidate) => candidate.id === id)
      if (!record || !value.text.match(new RegExp(`^0*${record.number}\\s*/\\s*\\d+\\s*[-–—ـ]`))) throw new Error(`English source reference mismatch for hadith ${id}.`)
      translationCount++
    }
  }
}

if (seenIds.size !== index.recordIds.length || index.recordIds.some((id) => !seenIds.has(id))) throw new Error('Collection index record IDs do not match its chapter files.')
const all = await loadJson(join(dataRoot, index.id, index.allFile), chapterSchema, 'All Riyad records')
if (all.records.length !== recordCount) throw new Error('All-records file count mismatch.')
if (index.languages.includes('en')) {
  const allEnglish = await loadJson(join(dataRoot, 'translations', 'en', index.id, 'all.json'), translationsSchema, 'All English translations')
  if (Object.keys(allEnglish.translations).length !== translationCount) throw new Error('English search index count mismatch.')
  if (Object.keys(allEnglish.translations).some((id) => !seenIds.has(id))) throw new Error('English search index contains an unknown hadith ID.')
}
console.log(`Validated IslamHouse/IslamEnc Riyad: ${recordCount} Arabic narrations, ${translationCount} English translations across ${index.chapters.length} chapters.`)
