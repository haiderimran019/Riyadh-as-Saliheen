import type { HadithRecord } from '../types/hadith'

export function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function selectDailyHadith<T extends HadithRecord>(records: T[], date: Date): T | undefined {
  if (records.length === 0) return undefined
  const seed = [...dateKey(date)].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 0)
  return records[seed % records.length]
}
