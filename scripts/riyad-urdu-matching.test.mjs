import { describe, expect, it } from 'vitest'
import { matchPublishedUrduNarration, normalizeArabicForMatching } from './riyad-urdu-matching.mjs'

const narration = 'عن راو من رواة هذا المثال الاصطناعي قال هذا نص عربي طويل للاختبار لا يمثل حديثا نبويا ولا يستخدم بوصفه مادة منشورة'
const record = { id: 'example-1', arabic: `1/1 ــ ${narration} ثم انتهى هذا المثال` }
const candidate = { id: 'example-source', hadeeth_ar: narration, hadeeth: 'صرف جانچ کے لیے فرضی متن۔', explanation: 'محفوظ ماخذ کا اضافی متن۔' }

describe('strict published Urdu narration matching', () => {
  it('normalizes presentation forms, diacritics, punctuation and alef/ya variants without changing source text', () => {
    expect(normalizeArabicForMatching('إِلَىٰ، أَﺑِي ــ راوٍ')).toBe(normalizeArabicForMatching('الى ابي راو'))
    const result = matchPublishedUrduNarration(record, [candidate])
    expect(result.status).toBe('accepted')
    expect(result.raw).toBe(candidate)
    expect(result.raw.hadeeth).toBe(candidate.hadeeth)
    expect(result.evidence.method).toBe('full-arabic-substring-v1')
    expect(result.evidence.normalizedArabicLength).toBeGreaterThanOrEqual(80)
  })

  it('rejects quote-only overlap when the full published Arabic narration differs', () => {
    const quoted = '«هذا نص اقتباس طويل لا يعد حديثا وهو يستخدم لاختبار التطابق الكامل فقط»'
    expect(matchPublishedUrduNarration({ arabic: `عن الراوي الاول ${quoted}` }, [
      { ...candidate, hadeeth_ar: `عن الراوي الثاني قال هذا مثال مختلف في المقدمة ${quoted}` },
    ]).status).toBe('missing')
  })

  it('rejects short matches and missing Urdu wording', () => {
    expect(matchPublishedUrduNarration({ arabic: 'نص قصير' }, [{ ...candidate, hadeeth_ar: 'نص قصير' }]).status).toBe('missing')
    expect(matchPublishedUrduNarration(record, [{ ...candidate, hadeeth: '' }]).status).toBe('missing')
  })

  it('rejects ambiguous source IDs instead of choosing the first match', () => {
    const result = matchPublishedUrduNarration(record, [candidate, { ...candidate, id: 'another-source' }])
    expect(result).toEqual({ status: 'ambiguous', candidateIds: ['another-source', 'example-source'] })
  })

  it('permits identical repeated records but rejects conflicting versions of one source ID', () => {
    expect(matchPublishedUrduNarration(record, [candidate, { ...candidate }]).status).toBe('accepted')
    expect(() => matchPublishedUrduNarration(record, [candidate, { ...candidate, hadeeth: 'مختلف متن۔' }])).toThrow('Conflicting Urdu source records')
  })

  it('does not fold different Arabic words into a match', () => {
    expect(matchPublishedUrduNarration(record, [{ ...candidate, hadeeth_ar: narration.replace('نص عربي طويل', 'نص عربي قصير') }]).status).toBe('missing')
    expect(normalizeArabicForMatching('حسن')).not.toBe(normalizeArabicForMatching('حسين'))
  })
})
