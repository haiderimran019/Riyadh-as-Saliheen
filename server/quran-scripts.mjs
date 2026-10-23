// The IndoPak corpus is fetched from the publisher for reading, with a bounded
// 24-hour runtime cache. It is not relabelled Uthmani text or generated text.
const cache = new Map()
const fontUrl = 'https://verses.quran.foundation/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2'
async function cached(key, load) {
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) return entry.value
  const value = await load()
  cache.set(key, { value, expires: Date.now() + 86400000 })
  return value
}
export async function indopakSurah(id, expected) {
  return cached(`surah:${id}`, async () => {
    const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${id}?fields=text_indopak_nastaleeq&per_page=300`, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error('This IndoPak edition could not be loaded. Please try again.')
    const value = await response.json()
    if (value.pagination?.next_page || value.verses?.length !== expected || value.verses.some((x,i) => x.verse_key !== `${id}:${i+1}` || !x.text_indopak_nastaleeq)) throw new Error('This IndoPak edition could not be verified. Please try again.')
    return { publisher: 'Quran Foundation / QuranWBW.com', sourceUrl: 'https://github.com/marwan/indopak-quran-text', credit: 'Ayman Siddiqui and R. Siddiqua · QuranWBW.com / Quran.com · Sadaqa-e-Jaria; not for sale; source text and credits preserved.', fontVersion: '4.2.1', result: value.verses.map(x => ({ aya: x.verse_number, text: x.text_indopak_nastaleeq })) }
  })
}
export async function indopakFont() {
  return cached('font', async () => {
    const response = await fetch(fontUrl, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) throw new Error('The IndoPak reading font could not be loaded.')
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length < 10000 || bytes.length > 6000000 || bytes.toString('ascii', 0, 4) !== 'wOF2') throw new Error('The IndoPak font could not be verified.')
    return bytes
  })
}
