import { describe, expect, it } from 'vitest'
import { normalizeArabic } from './normalize'

describe('normalizeArabic', () => {
  it('removes Arabic diacritics and tatweel', () => {
    expect(normalizeArabic('مُـحَمَّد')).toBe('محمد')
  })

  it('normalizes alef, ya, ta marbuta, waw and ya hamza variants', () => {
    expect(normalizeArabic('إِسْلَام آية هُدَى مسؤولة بيئة')).toBe('اسلام ايه هدي مسووله بييه')
  })

  it('collapses whitespace', () => {
    expect(normalizeArabic('  نص   عربي  ')).toBe('نص عربي')
  })
})
