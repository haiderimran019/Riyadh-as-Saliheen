import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const rawRoot = join(root, 'data-local', 'raw', 'quranenc')
const outputPath = join(root, 'data-local', 'generated', 'quran-of-day.json')
const translations = { en: 'english_rwwad', ur: 'urdu_junagarhi' }
const ayahReferences = [[1, 1], [2, 286], [13, 28], [39, 53], [94, 5], [94, 6]]
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function readJson(path) {
  try { await access(path); return JSON.parse(await readFile(path, 'utf8')) } catch { return null }
}

async function fetchCached(name, url) {
  const destination = join(rawRoot, name)
  const cached = await readJson(destination)
  if (cached) return cached
  let failure
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'Riyad-as-Saliheen-reader/0.2 data import' } })
      if (!response.ok) throw new Error(`QuranEnc returned HTTP ${response.status}`)
      const body = await response.json()
      await mkdir(rawRoot, { recursive: true })
      await writeFile(destination, JSON.stringify(body))
      return body
    } catch (error) {
      failure = error
      await delay(700 * (2 ** attempt))
    }
  }
  throw failure
}

const source = 'https://quranenc.com/api/v1'
const translationMetadata = {}
for (const [language, key] of Object.entries(translations)) {
  const response = await fetchCached(`translations-${language}.json`, `${source}/translations/list/${language}`)
  const edition = response.translations?.find((item) => item.key === key)
  if (!edition?.version || !edition.title) throw new Error(`QuranEnc edition metadata is missing for ${key}`)
  // Keep public-facing attribution anonymous while preserving the source title
  // and full source response in the ignored raw cache for local provenance.
  translationMetadata[language] = { key, title: language === 'ur' ? 'Urdu translation' : 'English translation', version: edition.version, sourceUrl: `${source}/translation/aya/${key}` }
}

const jobs = ayahReferences.flatMap(([sura, aya]) => Object.entries(translations).map(([language, key]) => ({ sura, aya, language, key })))
const responses = new Map()
let nextJob = 0
async function worker() {
  while (nextJob < jobs.length) {
    const { sura, aya, language, key } = jobs[nextJob++]
    const response = await fetchCached(`${key}-${sura}-${aya}.json`, `${source}/translation/aya/${key}/${sura}/${aya}`)
    if (!response.result?.arabic_text || !response.result?.translation) throw new Error(`Incomplete QuranEnc verse ${sura}:${aya} in ${language}`)
    responses.set(`${sura}:${aya}:${language}`, response.result)
    await delay(350)
  }
}
await Promise.all([worker(), worker()])

const ayahs = ayahReferences.map(([sura, aya]) => {
  const en = responses.get(`${sura}:${aya}:en`)
  const ur = responses.get(`${sura}:${aya}:ur`)
  if (en.arabic_text !== ur.arabic_text || en.sura !== ur.sura || en.aya !== ur.aya) throw new Error(`English and Urdu QuranEnc references do not align for ${sura}:${aya}`)
  return { sura, aya, arabic_text: en.arabic_text, translations: { en, ur } }
})

await mkdir(join(root, 'data-local', 'generated'), { recursive: true })
await writeFile(outputPath, JSON.stringify({
  publisher: 'QuranEnc.com',
  sourceUrl: 'https://quranenc.com',
  apiUrl: source,
  dateRetrieved: new Date().toISOString().slice(0, 10),
  translations: translationMetadata,
  ayahs,
}, null, 2))
console.log(`Prepared ${ayahs.length} versioned QuranEnc ayat in English and Urdu for the offline daily card.`)
