import { describe, expect, it } from 'vitest'
import { getChapterTitle } from './chapterTitle'

describe('getChapterTitle', () => {
  it('uses published English chapter names when present', () => {
    expect(getChapterTitle({ id: '2', title: '2- Chapter on Repentance', titleArabic: '2 ــ باب التوبة', file: 'chapter-2.json', count: 12 }, 'en')).toBe('Chapter on Repentance')
  })

  it('uses the published Arabic title instead of a generic chapter label', () => {
    expect(getChapterTitle({ id: '4', title: 'Chapter 4', titleArabic: '4 ــ باب الصدق', file: 'chapter-4.json', count: 6 }, 'en')).toBe('باب الصدق')
  })

  it('uses the Arabic title in Urdu mode', () => {
    expect(getChapterTitle({ id: '2', title: '2- Chapter on Repentance', titleArabic: '2 ــ باب التوبة', file: 'chapter-2.json', count: 12 }, 'ur')).toBe('باب التوبة')
  })
})
