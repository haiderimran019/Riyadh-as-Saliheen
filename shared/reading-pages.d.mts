export const QURAN_PAGE_SIZE: number
export function quranPage(ayah: string | number | null, count: number): { requested: number; start: number; end: number }
