import { describe, expect, it } from 'vitest'
import { stripArabicDiacritics } from './arabicText'

describe('stripArabicDiacritics', () => {
  it('removes vowel marks while preserving Arabic letters and spacing', () => {
    expect(stripArabicDiacritics('بِسْمِ اللَّهِ')).toBe('بسم الله')
  })

  it('leaves text without diacritics unchanged', () => {
    expect(stripArabicDiacritics('رياض الصالحين')).toBe('رياض الصالحين')
  })
})
