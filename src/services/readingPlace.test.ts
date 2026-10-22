import { expect, test } from 'vitest'
import { quranPage } from '../../shared/reading-pages.mjs'
import { ayahAtReadingLine, hadithReadingUrl, quranReadingUrl } from './readingPlace'

test('Quran pagination keeps complete 20-ayah groups and the final partial group', () => {
  expect(quranPage('20', 286)).toEqual({ requested: 20, start: 0, end: 20 })
  expect(quranPage('21', 286)).toEqual({ requested: 21, start: 20, end: 40 })
  expect(quranPage('255', 286)).toEqual({ requested: 255, start: 240, end: 260 })
  expect(quranPage('999', 286)).toEqual({ requested: 286, start: 280, end: 286 })
  expect(quranPage('invalid', 7)).toEqual({ requested: 1, start: 0, end: 7 })
})

test('reading position stays with a long ayah until the next ayah reaches the reading line', () => {
  expect(ayahAtReadingLine([{ ayah: 281, top: -1300 }, { ayah: 282, top: 1200 }], 180)).toBe(281)
  expect(ayahAtReadingLine([{ ayah: 281, top: -2500 }, { ayah: 282, top: 160 }], 180)).toBe(282)
  expect(ayahAtReadingLine([], 180)).toBeUndefined()
})

test('return links identify the exact passage for the server and browser', () => {
  expect(quranReadingUrl(2, 255)).toBe('/quran/2?ayah=255#ayah-255')
  expect(hadithReadingUrl({ collectionId: 'riyad-as-salihin', chapterId: '296', hadithId: '1643-1', updatedAt: 1 }))
    .toBe('/collection/riyad-as-salihin/chapter/296?hadith=1643-1#1643-1')
})
