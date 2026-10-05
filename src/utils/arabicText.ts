const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function stripArabicDiacritics(value: string) {
  return value.replace(ARABIC_DIACRITICS, '')
}
