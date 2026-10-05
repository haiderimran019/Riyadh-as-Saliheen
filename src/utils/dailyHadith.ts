import type { HadithRecord } from '../types/hadith'
import type { DailyQuranDataset } from '../types/hadith'

const DAILY_ROTATION_MS = 6 * 60 * 60 * 1000

export function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function selectDailyHadith<T extends HadithRecord>(records: T[], date: Date): T | undefined {
  if (records.length === 0) return undefined
  return records[selectDailyIndex(records.length, date)]
}

export function selectDailyIndex(length: number, date: Date) {
  if (length <= 0) return -1
  const window = Math.floor(date.getTime() / DAILY_ROTATION_MS)
  return ((window % length) + length) % length
}

export function selectDailyAyah(dataset: DailyQuranDataset, date: Date) {
  return dataset.ayahs[selectDailyIndex(dataset.ayahs.length, date)]
}
