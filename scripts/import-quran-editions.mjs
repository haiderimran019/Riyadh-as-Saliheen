import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { quranEditions } from '../shared/quran-editions.mjs'

const root = resolve('data-local/generated/quran')
const index = JSON.parse(readFileSync(resolve(root, 'index.json'), 'utf8'))
async function download(url) {
  let error
  for (let attempt = 0; attempt < 4; attempt++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`Source returned ${r.status}`); return await r.text() }
    catch (e) { error = e; await new Promise(r => setTimeout(r, 500 * (attempt + 1))) }
  }
  throw error
}
const catalogue = JSON.parse(await download('https://quranenc.com/api/v1/translations/list')).translations
const editions = []
for (const edition of quranEditions) {
  if (edition.key === 'english_saheeh') { editions.push({ ...edition, version: index.edition.version }); continue }
  const directory = resolve(root, 'editions', edition.key)
  mkdirSync(directory, { recursive: true })
  const source = catalogue.find(x => x.key === edition.key)
  const metadata = { arabicSource: 'QuranEnc.com · preserved Arabic text from the source edition', publisher: edition.publisher, sourceUrl: source ? `https://quranenc.com/en/browse/${edition.key}` : 'https://tanzil.net/trans/', edition: { ...edition, version: source?.version || `Tanzil download ${new Date().toISOString().slice(0,10)}` }, dateRetrieved: new Date().toISOString(), terms: source ? 'QuranEnc: unchanged text, edition, notes and attribution.' : 'Tanzil translations: non-commercial use only. https://tanzil.net/trans/' }
  let flat
  if (!source) {
    const key = edition.key === 'urdu_jalandhry' ? 'ur.jalandhry' : 'bn.bengali'
    const text = await download(`https://tanzil.net/trans/?transID=${key}&type=txt`)
    flat = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim() && !x.startsWith('#'))
    if (flat.length !== 6236 || flat.some(x => /<html|<!doctype/i.test(x))) throw new Error(`Invalid ${key} source: ${flat.length} ayahs`)
  }
  let offset = 0
  for (const chapter of index.chapters) {
    const file = resolve(directory, `${chapter.id}.json`)
    let result
    if (source && existsSync(file)) {
      const old = JSON.parse(readFileSync(file, 'utf8'))
      if (old.metadata.edition.version === source.version) result = old.result
    }
    if (!result) {
      if (source) result = JSON.parse(await download(`https://quranenc.com/api/v1/translation/sura/${edition.key}/${chapter.id}`)).result
      else result = JSON.parse(readFileSync(resolve(root, `${chapter.id}.json`), 'utf8')).result.map((ayah, i) => ({ ...ayah, translation: flat[offset + i], footnotes: '' }))
    }
    if (result.length !== chapter.count || result.some((x, i) => Number(x.sura) !== chapter.id || Number(x.aya) !== i + 1 || !x.translation)) throw new Error(`Incomplete ${edition.key}, surah ${chapter.id}`)
    writeFileSync(file, JSON.stringify({ metadata, result }))
    offset += chapter.count
  }
  editions.push({ ...edition, version: metadata.edition.version })
  console.log(`Validated ${edition.key}: ${offset} complete ayahs`)
}
writeFileSync(resolve(root, 'editions.json'), JSON.stringify({ editions, count: 6236, terms: 'Source text and credits preserved. Tanzil translations are for non-commercial use.' }, null, 2))
