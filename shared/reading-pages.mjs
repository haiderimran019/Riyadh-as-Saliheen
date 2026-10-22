export const QURAN_PAGE_SIZE = 20

export function quranPage(ayah, count) {
  const requested = Math.min(count, Math.max(1, parseInt(String(ayah), 10) || 1))
  const start = Math.floor((requested - 1) / QURAN_PAGE_SIZE) * QURAN_PAGE_SIZE
  return { requested, start, end: Math.min(start + QURAN_PAGE_SIZE, count) }
}
