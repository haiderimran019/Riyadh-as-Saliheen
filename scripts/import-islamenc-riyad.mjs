import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'

const projectRoot = process.cwd()
const rawRoot = join(projectRoot, 'data-local', 'raw', 'riyadh-islamenc')
const outputRoot = join(projectRoot, 'data-local', 'generated')
const totalPages = 376
const args = process.argv.slice(2)
const languageArg = args.find((arg) => arg.startsWith('--languages='))?.split('=')[1]
const languages = languageArg ? languageArg.split(',').filter((language) => ['ar', 'en'].includes(language)) : ['ar', 'en']
if (!languages.includes('ar')) throw new Error('Arabic is required as the base edition. Use --languages=ar,en.')

const metadata = {
  sourceName: 'IslamHouse.com / IslamEnc.com',
  sourceUrl: 'https://riyadh.islamenc.com',
  contributor: 'IslamHouse / IslamEnc editorial team',
  contributorRole: 'editor',
  license: 'IslamHouse content reuse policy permits use in apps and offline when the original text and source are preserved and clearly credited; see the IslamHouse API Hub README.',
  dateRetrieved: new Date().toISOString().slice(0, 10),
}

async function exists(path) {
  try { await access(path); return true } catch { return false }
}

async function fetchPage(language, page) {
  const directory = join(rawRoot, language)
  await mkdir(directory, { recursive: true })
  const destination = join(directory, `${page}.html`)
  if (await exists(destination)) return false
  const url = `https://riyadh.islamenc.com/${language}/page/${page}`
  let lastError
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'Riyad-as-Saliheen-reader/0.1 data import' } })
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
      const html = await response.text()
      if (!html.includes('single-page-inner')) throw new Error(`Unexpected page content for ${url}`)
      await writeFile(destination, html)
      return true
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 600 * (2 ** attempt)))
    }
  }
  throw lastError
}

const jobs = languages.flatMap((language) => Array.from({ length: totalPages }, (_, index) => [language, index + 1]))
let nextJob = 0
let complete = 0
async function worker() {
  while (nextJob < jobs.length) {
    const job = jobs[nextJob++]
    const fetched = await fetchPage(...job)
    complete++
    if (complete % 40 === 0 || complete === jobs.length) console.log(`Fetched or reused ${complete}/${jobs.length} source pages.`)
    if (fetched) await new Promise((resolve) => setTimeout(resolve, 300))
  }
}
await Promise.all([worker(), worker()])

function readPage(language, page) {
  return readFile(join(rawRoot, language, `${page}.html`), 'utf8').then((html) => {
    const document = new JSDOM(html).window.document
    return [...document.querySelectorAll('.single-page-inner .row.page')].map((row) => {
      const text = row.textContent?.replace(/\s+/gu, ' ').trim() ?? ''
      const heading = row.querySelector('h1')?.textContent?.replace(/\s+/gu, ' ').trim() ?? ''
      const headingNumber = Number(heading.match(/^\s*(\d+)\s*[-–—ـ]/u)?.[1])
      const match = text.match(/^(\d+)\s*\/\s*(\d+)\s*[-–—ـ]+/u)
      const record = match ? {
        sourceNumber: String(Number(language === 'ar' ? match[2] : match[1])),
        inChapterNumber: language === 'ar' ? match[1] : match[2],
        text,
      } : undefined
      return { headingNumber: Number.isFinite(headingNumber) && headingNumber > 0 ? headingNumber : 0, heading, record }
    })
  })
}

const pageData = new Map()
for (const language of languages) {
  for (let page = 1; page <= totalPages; page++) pageData.set(`${language}:${page}`, await readPage(language, page))
}

const chapters = new Map()
const englishRecords = []
const arabicOccurrences = new Map()
const activeChapter = { ar: 0, en: 0 }
function getChapter(number) {
  const chapter = chapters.get(number) ?? { id: String(number), title: '', titleArabic: '', records: new Map() }
  chapters.set(number, chapter)
  return chapter
}

for (let page = 1; page <= totalPages; page++) {
  const recordsByChapter = new Map()
  for (const language of languages) {
    for (const row of pageData.get(`${language}:${page}`)) {
      if (row.headingNumber) {
        activeChapter[language] = row.headingNumber
        const chapter = getChapter(row.headingNumber)
        if (language === 'ar') chapter.titleArabic = row.heading
        else chapter.title = row.heading
      }
      if (!row.record) continue
      const chapterNumber = activeChapter[language]
      if (!chapterNumber) throw new Error(`Could not identify chapter for ${language} record on source page ${page}`)
      if (language === 'en') {
        englishRecords.push(row.record)
        continue
      }
      const records = recordsByChapter.get(chapterNumber) ?? []
      records.push(row.record)
      recordsByChapter.set(chapterNumber, records)
    }
  }

  for (const [chapterNumber, records] of recordsByChapter) {
    const chapter = getChapter(chapterNumber)
    for (const record of records) {
      if ([...chapter.records.values()].some((item) => item.number === record.sourceNumber && item.arabic === record.text)) continue
      const occurrence = (arabicOccurrences.get(record.sourceNumber) ?? 0) + 1
      arabicOccurrences.set(record.sourceNumber, occurrence)
      const id = `${record.sourceNumber}-${occurrence}`
      chapter.records.set(id, { id, number: record.sourceNumber, inChapterNumber: record.inChapterNumber, arabic: record.text, translations: {} })
    }
  }
}

// IslamEnc numbers entries globally, but Arabic and English volumes do not
// always divide the same chapters across the same page boundaries. Pair by
// the global source number instead of the displayed chapter/page grouping.
const arabicByNumber = new Map()
for (const chapter of chapters.values()) {
  for (const record of chapter.records.values()) {
    const matches = arabicByNumber.get(record.number) ?? []
    matches.push(record)
    arabicByNumber.set(record.number, matches)
  }
}
let unmatchedEnglish = 0
const englishSeen = new Set()
const usedArabicIds = new Set()
for (const record of englishRecords) {
  const matches = arabicByNumber.get(record.sourceNumber) ?? []
  const existing = matches.find((item) => !usedArabicIds.has(item.id))
  if (!existing) { unmatchedEnglish++; continue }
  if (englishSeen.has(existing.id)) { unmatchedEnglish++; continue }
  existing.translations.en = { text: record.text, language: 'en' }
  englishSeen.add(existing.id)
  usedArabicIds.add(existing.id)
}

if (chapters.size < 300) throw new Error(`Only found ${chapters.size} chapters; refusing to emit incomplete data.`)
const chapterIndexes = []
const allRecords = []
const allTranslations = {}
let arabicCount = 0
let englishCount = 0
let missingEnglish = 0
const allRecordIds = []

for (const chapter of [...chapters.values()].filter((item) => item.records.size > 0).sort((a, b) => Number(a.id) - Number(b.id))) {
  const records = [...chapter.records.values()].sort((a, b) => Number(a.inChapterNumber) - Number(b.inChapterNumber))
  const file = `chapters/chapter-${chapter.id}.json`
  const outputRecords = records.map((record) => {
    arabicCount++
    allRecordIds.push(record.id)
    if (record.translations.en) englishCount++
    else missingEnglish++
    return {
      id: record.id,
      collection: 'Riyad as-Salihin',
      book: 'Riyad as-Salihin',
      chapter: chapter.id,
      number: record.number,
      chapterNumber: record.inChapterNumber,
      arabic: record.arabic,
      grades: [],
      references: [],
      sourceName: 'IslamEnc.com',
    }
  })
  allRecords.push(...outputRecords)
  const translations = Object.fromEntries(records.filter((record) => record.translations.en).map((record) => [record.id, record.translations.en]))
  Object.assign(allTranslations, translations)
  await mkdir(join(outputRoot, 'riyad-as-salihin', 'chapters'), { recursive: true })
  await writeFile(join(outputRoot, 'riyad-as-salihin', file), JSON.stringify({ metadata, records: outputRecords }))
  if (languages.includes('en')) {
    const translationDirectory = join(outputRoot, 'translations', 'en', 'riyad-as-salihin', 'chapters')
    const translationPath = join(outputRoot, 'translations', 'en', 'riyad-as-salihin', file)
    await mkdir(translationDirectory, { recursive: true })
    await writeFile(translationPath, JSON.stringify({ metadata, translations }))
  }
  chapterIndexes.push({ id: chapter.id, title: chapter.title || chapter.titleArabic || `باب ${chapter.id}`, titleArabic: chapter.titleArabic, file, count: records.length })
}

const collection = {
  id: 'riyad-as-salihin',
  title: 'Riyad as-Salihin',
  description: 'The Gardens of the Righteous, presented in its original chapters.',
  languages: languages.includes('en') ? ['en'] : [],
  languageNames: languages.includes('en') ? { en: 'English' } : {},
  metadata,
  chapters: chapterIndexes,
  allFile: 'all.json',
  recordIds: allRecordIds,
  arabicCount,
  englishCount,
  missingEnglish,
}
if (new Set(allRecordIds).size !== allRecordIds.length) throw new Error('Duplicate source hadith IDs found across chapter pages.')
await writeFile(join(outputRoot, 'riyad-as-salihin', 'all.json'), JSON.stringify({ metadata, records: allRecords }))
if (languages.includes('en')) await writeFile(join(outputRoot, 'translations', 'en', 'riyad-as-salihin', 'all.json'), JSON.stringify({ metadata, translations: allTranslations }))
await writeFile(join(outputRoot, 'riyad-as-salihin', 'index.json'), JSON.stringify(collection, null, 0))
await writeFile(join(outputRoot, 'collections.json'), JSON.stringify({ metadata, collections: [{ id: collection.id, title: collection.title, description: collection.description, index: `${collection.id}/index.json` }] }, null, 0))
await writeFile(join(outputRoot, 'sources.json'), JSON.stringify({ metadata, sources: [{ collection: collection.id, kind: 'arabic', metadata }, ...(languages.includes('en') ? [{ collection: collection.id, kind: 'translation', language: 'en', metadata }] : [])] }, null, 0))

console.log(JSON.stringify({ pagesPerLanguage: totalPages, chapters: chapterIndexes.length, ArabicRecords: arabicCount, EnglishTranslations: englishCount, missingEnglish, unmatchedEnglish }, null, 2))
