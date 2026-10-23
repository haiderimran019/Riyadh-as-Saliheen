export type QuranEdition = { key: string; language: string; title: string; publisher: string }
export const quranEditions: QuranEdition[]
export function defaultEdition(language: string): string
