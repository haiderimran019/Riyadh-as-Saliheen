import type { ReadingProgress } from '../data/db'

export const quranReadingUrl = (surah: number, ayah: number) => `/quran/${surah}?ayah=${ayah}#ayah-${ayah}`
export const hadithReadingUrl = (place: ReadingProgress) => `/collection/${encodeURIComponent(place.collectionId)}/chapter/${encodeURIComponent(place.chapterId)}?hadith=${encodeURIComponent(place.hadithId)}#${encodeURIComponent(place.hadithId)}`

// Select by the reading line, rather than intersection ratio: a long ayah can
// fill several screens and must stay current until the next ayah is reached.
export function ayahAtReadingLine(items: Array<{ ayah: number; top: number }>, line: number) {
  let ayah = items[0]?.ayah
  for (const item of items) {
    if (item.top > line) break
    ayah = item.ayah
  }
  return ayah
}
