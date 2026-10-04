import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

if (process.env.VITE_DATA_MODE === 'placeholder') {
  console.log('Preview mode has no bundled hadith data; validation skipped.')
  process.exit(0)
}

const dataRoot = join(process.cwd(), 'data-local', 'generated')
const metadataSchema = z.object({ sourceName: z.literal('HadeethEnc.com'), sourceUrl: z.string().url(), contributor: z.literal('HadeethEnc.com'), license: z.string().min(1), dateRetrieved: z.string().date() }).passthrough()
const manifestSchema = z.object({ metadata: metadataSchema, collections: z.array(z.object({ id: z.literal('hadeethenc'), title: z.string().min(1), description: z.string().min(1), index: z.string().min(1) }).passthrough()).min(1) }).passthrough()
const indexSchema = z.object({ id: z.literal('hadeethenc'), languages: z.array(z.string()), recordIds: z.array(z.string().min(1)).min(1), chapters: z.array(z.object({ id: z.string(), title: z.string().min(1), file: z.string().min(1), count: z.number().int().nonnegative() }).passthrough()), categories: z.array(z.unknown()), roots: z.array(z.string()), metadata: metadataSchema }).passthrough()
const apiRecordSchema = z.record(z.string(), z.unknown())
const hadithSchema = z.object({ id: z.string().min(1), arabic: z.string().min(1), hadeethEnc: apiRecordSchema }).passthrough()
const chapterSchema = z.object({ metadata: metadataSchema, records: z.array(hadithSchema) }).passthrough()
const recordSchema = z.object({ metadata: metadataSchema, record: hadithSchema }).passthrough()
const translationSchema = z.object({ text: z.string().min(1), raw: apiRecordSchema }).passthrough()
const translationsSchema = z.object({ metadata: metadataSchema, translations: z.record(z.string(), translationSchema) }).passthrough()
const placeholderMarker = `[${'PLACE'}HOLDER`

async function loadJson(path, schema, label) {
  const text = await readFile(path, 'utf8')
  if (text.includes(placeholderMarker)) throw new Error(`${label} contains forbidden fabricated sample content`)
  return schema.parse(JSON.parse(text))
}

await access(dataRoot)
const manifest = await loadJson(join(dataRoot, 'collections.json'), manifestSchema, 'Collection manifest')
const index = await loadJson(join(dataRoot, manifest.collections[0].index), indexSchema, 'Collection index')
let recordCount = 0
let translationCount = 0

for (const id of index.recordIds) {
  const dataset = await loadJson(join(dataRoot, 'hadeethenc', 'records', `${encodeURIComponent(id)}.json`), recordSchema, `Hadith ${id}`)
  const rawText = dataset.record.hadeethEnc.hadeeth_ar ?? dataset.record.hadeethEnc.hadeeth
  if (dataset.record.id !== id || dataset.record.id !== String(dataset.record.hadeethEnc.id) || dataset.record.arabic !== rawText || !rawText) {
    throw new Error(`Arabic source value mismatch for hadith ${id}`)
  }
}

for (const chapter of index.chapters) {
  const dataset = await loadJson(join(dataRoot, 'hadeethenc', chapter.file), chapterSchema, `Arabic category ${chapter.id}`)
  for (const record of dataset.records) {
    const rawText = record.hadeethEnc.hadeeth_ar ?? record.hadeethEnc.hadeeth
    if (record.id !== String(record.hadeethEnc.id) || record.arabic !== rawText || !rawText) {
      throw new Error(`Arabic source value mismatch in category ${chapter.id}, hadith ${record.id}`)
    }
  }
  recordCount += dataset.records.length

  for (const language of index.languages) {
    const path = join(dataRoot, 'translations', language, 'hadeethenc', chapter.file)
    try { await access(path) } catch { continue }
    const translationData = await loadJson(path, translationsSchema, `${language} category ${chapter.id}`)
    for (const [id, translation] of Object.entries(translationData.translations)) {
      if (String(translation.raw.id) !== id || translation.text !== translation.raw.hadeeth) {
        throw new Error(`${language} source value mismatch in category ${chapter.id}, hadith ${id}`)
      }
    }
    translationCount += Object.keys(translationData.translations).length
  }
}

console.log(`Validated HadeethEnc: ${recordCount} category records and ${translationCount} translation records across ${index.chapters.length} topics.`)
