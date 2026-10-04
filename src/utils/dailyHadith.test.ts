import { describe, expect, it } from 'vitest'
import type { HadithRecord } from '../types/hadith'
import { dateKey, selectDailyHadith } from './dailyHadith'

const record = (id: string): HadithRecord => ({
  id,
  collection: 'Collection',
  book: 'Book',
  chapter: '1',
  number: id,
  arabic: '',
  grades: [],
  references: [],
})

describe('daily hadith selection', () => {
  it('uses a stable local calendar date key', () => {
    expect(dateKey(new Date(2026, 9, 4, 23, 59))).toBe('2026-10-04')
  })

  it('returns the same record for the same date and pool', () => {
    const records = [record('1'), record('2'), record('3')]
    const date = new Date(2026, 9, 4)
    expect(selectDailyHadith(records, date)?.id).toBe(selectDailyHadith(records, date)?.id)
  })

  it('works without translations and handles an empty pool', () => {
    expect(selectDailyHadith([record('1')], new Date())?.id).toBe('1')
    expect(selectDailyHadith([], new Date())).toBeUndefined()
  })
})
