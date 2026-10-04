import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const BASE_URL = 'https://hadeethenc.com/api/v1'
const LOCAL_ROOT = join(process.cwd(), 'data-local')
const RAW_ROOT = join(LOCAL_ROOT, 'raw')
const OUTPUT_ROOT = join(LOCAL_ROOT, 'generated')
const DEFAULT_LANGUAGES = ['ar', 'en', 'ur', 'bn', 'hi']
const requested = process.argv.find((value) => value.startsWith('--languages='))?.split('=')[1]
const languages = (requested ? requested.split(',') : DEFAULT_LANGUAGES).map((value) => value.trim()).filter(Boolean)
const retrieved = new Date().toISOString().slice(0, 10)
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function exists(path) {
  try { await stat(path); return true } catch { return false }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value)}\n`)
}

async function cachedRequest(path, cacheGroup) {
  const key = createHash('sha256').update(path).digest('hex').slice(0, 20)
  const cachePath = join(RAW_ROOT, cacheGroup, `${key}.json`)
  if (await exists(cachePath)) return JSON.parse(await readFile(cachePath, 'utf8'))
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await pause(250 + attempt * 250)
    const response = await fetch(`${BASE_URL}/${path}`, { headers: { Accept: 'application/json', 'User-Agent': 'hadith-reader-import/1.0' } })
    if (response.ok) {
      const value = await response.json()
      await writeJson(cachePath, value)
      return value
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`${response.status} ${path}`)
    await pause(750 * 2 ** attempt)
  }
  throw new Error(`Retries exhausted: ${path}`)
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(values[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker))
  return results
}

const allLanguages = await cachedRequest('languages', 'metadata')
const languageByCode = new Map(allLanguages.map((language) => [language.code, language]))
for (const language of languages) if (!languageByCode.has(language)) throw new Error(`Unsupported language: ${language}`)

const [roots, categories] = await Promise.all([
  cachedRequest('categories/roots/?language=en', 'metadata'),
  cachedRequest('categories/list/?language=en', 'metadata'),
])

async function listRoot(root) {
  const first = await cachedRequest(`hadeeths/list/?language=en&category_id=${root.id}&page=1&per_page=100`, 'lists')
  const pages = Array.from({ length: Number(first.meta.last_page) - 1 }, (_, index) => index + 2)
  const rest = await mapConcurrent(pages, 2, (page) => cachedRequest(`hadeeths/list/?language=en&category_id=${root.id}&page=${page}&per_page=100`, 'lists'))
  return [first, ...rest].flatMap((page) => page.data)
}

const listRecords = (await mapConcurrent(roots, 2, listRoot)).flat()
const listById = new Map(listRecords.map((record) => [String(record.id), record]))
const ids = [...listById.keys()]
const batches = Array.from({ length: Math.ceil(ids.length / 25) }, (_, index) => ids.slice(index * 25, index * 25 + 25))
const recordsByLanguage = new Map()

for (const language of languages) {
  const available = new Set(ids.filter((id) => listById.get(id).translations.includes(language)))
  const languageBatches = batches.map((batch) => batch.filter((id) => available.has(id))).filter((batch) => batch.length > 0)
  const responses = await mapConcurrent(languageBatches, 2, (batch) => cachedRequest(`hadeeths/multiple/?language=${language}&ids=${batch.join(',')}`, `records/${language}`))
  recordsByLanguage.set(language, responses.flat())
}

const arabicRecords = recordsByLanguage.get('ar') ?? []
const arabicById = new Map(arabicRecords.map((record) => [String(record.id), record]))
const recordsForCategory = new Map(categories.map((category) => [String(category.id), []]))
for (const record of arabicRecords) for (const categoryId of record.categories ?? []) recordsForCategory.get(String(categoryId))?.push(record)

const sourceMetadata = { sourceName: 'HadeethEnc.com', sourceUrl: 'https://hadeethenc.com', contributor: 'HadeethEnc.com', contributorRole: 'translator', license: 'HadeethEnc reuse terms', dateRetrieved: retrieved }
const chapters = categories.filter((category) => (recordsForCategory.get(String(category.id))?.length ?? 0) > 0).map((category) => ({ id: String(category.id), title: category.title, file: `category-${category.id}.json`, count: recordsForCategory.get(String(category.id)).length }))
const languageCounts = Object.fromEntries(languages.map((language) => [language, recordsByLanguage.get(language)?.length ?? 0]))
const categoryTitle = new Map(categories.map((category) => [String(category.id), category.title]))
const normalizeArabic = (raw, chapterTitle = categoryTitle.get(String(raw.categories?.[0])) ?? 'Topics') => ({ id: String(raw.id), collection: 'HadeethEnc', book: 'HadeethEnc', chapter: chapterTitle, number: String(raw.id), arabic: raw.hadeeth_ar ?? raw.hadeeth, title: raw.title, attribution: raw.attribution, grades: raw.grade ? [{ grader: 'HadeethEnc', grade: raw.grade }] : [], references: [], topics: raw.categories, hadeethEnc: raw })

await writeJson(join(OUTPUT_ROOT, 'collections.json'), { metadata: sourceMetadata, collections: [{ id: 'hadeethenc', title: 'HadeethEnc', description: 'Hadith organized by topic.', index: 'hadeethenc/index.json' }] })
await writeJson(join(OUTPUT_ROOT, 'sources.json'), { metadata: sourceMetadata, sources: languages.map((language) => ({ collection: 'hadeethenc', kind: language === 'ar' ? 'arabic' : 'translation', language: language === 'ar' ? undefined : language, metadata: sourceMetadata })) })
await writeJson(join(OUTPUT_ROOT, 'hadeethenc/index.json'), { id: 'hadeethenc', title: 'HadeethEnc', description: 'Browse hadith by topic.', languages: languages.filter((language) => language !== 'ar'), languageCounts, languageNames: Object.fromEntries(languages.map((language) => [language, languageByCode.get(language).native])), metadata: sourceMetadata, allFile: 'all.json', recordIds: ids, chapters, categories, roots: roots.map((root) => String(root.id)) })
await writeJson(join(OUTPUT_ROOT, 'hadeethenc/all.json'), { metadata: sourceMetadata, records: arabicRecords.map((raw) => normalizeArabic(raw)) })
for (const raw of arabicRecords) {
  await writeJson(join(OUTPUT_ROOT, 'hadeethenc', 'records', `${raw.id}.json`), { metadata: sourceMetadata, record: normalizeArabic(raw) })
}

for (const chapter of chapters) {
  const records = recordsForCategory.get(chapter.id)
  await writeJson(join(OUTPUT_ROOT, 'hadeethenc', chapter.file), {
    metadata: sourceMetadata,
    records: records.map((raw) => normalizeArabic(raw, chapter.title)),
  })
  const recordIds = new Set(records.map((record) => String(record.id)))
  for (const language of languages.filter((value) => value !== 'ar')) {
    const translated = (recordsByLanguage.get(language) ?? []).filter((record) => recordIds.has(String(record.id)))
    const translations = Object.fromEntries(translated.map((raw) => [String(raw.id), { text: raw.hadeeth, raw }]))
    await writeJson(join(OUTPUT_ROOT, 'translations', language, 'hadeethenc', chapter.file), { metadata: sourceMetadata, translations })
  }
}

const gradesByLanguage = {}
for (const [language, records] of recordsByLanguage) {
  const grades = new Map()
  for (const record of records) if (record.grade) grades.set(record.grade, (grades.get(record.grade) ?? 0) + 1)
  gradesByLanguage[language] = Object.fromEntries([...grades].sort())
}
const missingTranslations = Object.fromEntries(languages.map((language) => [language, ids.length - (recordsByLanguage.get(language)?.length ?? 0)]))
const sizes = {}
for (const language of languages) {
  let bytes = 0
  for (const chapter of chapters) {
    const path = language === 'ar' ? join(OUTPUT_ROOT, 'hadeethenc', chapter.file) : join(OUTPUT_ROOT, 'translations', language, 'hadeethenc', chapter.file)
    bytes += (await stat(path)).size
  }
  sizes[language] = bytes
}
await writeJson(join(LOCAL_ROOT, 'report.json'), { retrieved, languages, distinctHadiths: ids.length, hadithPerLanguage: languageCounts, bytesPerLanguage: sizes, gradesByLanguage, missingTranslations })
console.log(JSON.stringify({ distinctHadiths: ids.length, hadithPerLanguage: languageCounts, bytesPerLanguage: sizes, distinctGradeValuesPerLanguage: Object.fromEntries(Object.entries(gradesByLanguage).map(([language, grades]) => [language, Object.keys(grades).length])), missingTranslations }, null, 2))
