import { describe, expect, it } from 'vitest'
import type { HadithRecord } from '../types/hadith'
import { dateKey, selectDailyAyah, selectDailyHadith } from './dailyHadith'

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

  it('rotates to the next selection on each six-hour UTC boundary', () => {
    const records = [record('1'), record('2'), record('3')]
    const before = new Date('2026-10-05T05:59:59.999Z')
    const after = new Date('2026-10-05T06:00:00.000Z')
    expect(selectDailyHadith(records, before)?.id).not.toBe(selectDailyHadith(records, after)?.id)
    expect(selectDailyHadith(records, new Date('2026-10-05T11:59:59.999Z'))?.id).toBe(selectDailyHadith(records, after)?.id)
  })

  it('works without translations and handles an empty pool', () => {
    expect(selectDailyHadith([record('1')], new Date())?.id).toBe('1')
    expect(selectDailyHadith([], new Date())).toBeUndefined()
  })

  it('selects a stable, locally bundled daily ayah by date', () => {
    const ayahs = [{ sura: 1, aya: 1 }, { sura: 2, aya: 286 }, { sura: 13, aya: 28 }]
    const dataset = { ayahs } as never
    const date = new Date(2026, 9, 5)
    expect(selectDailyAyah(dataset, date)).toEqual(selectDailyAyah(dataset, new Date(2026, 9, 5)))
    expect(ayahs).toContainEqual(selectDailyAyah(dataset, date))
  })

  it('rotates the offline ayah selection every six hours', () => {
    const ayahs = [{ sura: 1, aya: 1 }, { sura: 2, aya: 286 }, { sura: 13, aya: 28 }]
    const dataset = { ayahs } as never
    expect(selectDailyAyah(dataset, new Date('2026-10-05T05:59:59.999Z')))
      .not.toEqual(selectDailyAyah(dataset, new Date('2026-10-05T06:00:00.000Z')))
  })
})
