export const URDU_MATCH_METHOD = 'full-arabic-substring-v1'
export const MINIMUM_ARABIC_MATCH_LENGTH = 80

// Matching only: never apply this normalization to stored or displayed text.
// NFKC expands Arabic presentation forms; the remaining steps remove marks,
// tatweel, punctuation and spacing, and fold common alef/ya letter forms.
export function normalizeArabicForMatching(value) {
  return value.normalize('NFKC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/gu, '')
    .replace(/[أإآٱ]/gu, 'ا')
    .replace(/ى/gu, 'ي')
    .replace(/[^\p{Script=Arabic}\p{Number}]+/gu, '')
}

export function matchPublishedUrduNarration(record, candidates) {
  if (typeof record?.arabic !== 'string') throw new Error('Riyad Arabic text is required for matching.')
  const normalizedRiyad = normalizeArabicForMatching(record.arabic)
  const matchingById = new Map()
  for (const candidate of candidates) {
    if (typeof candidate?.id !== 'string' || typeof candidate.hadeeth_ar !== 'string' || typeof candidate.hadeeth !== 'string' || !candidate.hadeeth.trim()) continue
    const normalizedSource = normalizeArabicForMatching(candidate.hadeeth_ar)
    if (normalizedSource.length < MINIMUM_ARABIC_MATCH_LENGTH) continue
    const start = normalizedRiyad.indexOf(normalizedSource)
    if (start < 0) continue
    const previous = matchingById.get(candidate.id)
    if (previous && JSON.stringify(previous.raw) !== JSON.stringify(candidate)) {
      throw new Error(`Conflicting Urdu source records for HadeethEnc ${candidate.id}.`)
    }
    matchingById.set(candidate.id, { raw: candidate, normalizedSource, start })
  }

  const matching = [...matchingById.values()]
  if (matching.length === 0) return { status: 'missing', candidateIds: [] }
  if (matching.length > 1) return { status: 'ambiguous', candidateIds: matching.map((value) => value.raw.id).sort() }
  const [{ raw, normalizedSource, start }] = matching
  return {
    status: 'accepted',
    raw,
    evidence: {
      method: URDU_MATCH_METHOD,
      hadeethEncId: raw.id,
      minimumArabicLength: MINIMUM_ARABIC_MATCH_LENGTH,
      normalizedArabicLength: normalizedSource.length,
      normalizedStart: start,
      normalizedEnd: start + normalizedSource.length,
    },
  }
}
