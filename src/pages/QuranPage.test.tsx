import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BootProvider, type QuranIndex, type QuranSura } from '../ssr/BootData'
import { QuranPage } from './QuranPage'

const stores = vi.hoisted(() => ({ saved: new Map<string, unknown>(), progress: vi.fn() }))
vi.mock('../i18n', () => ({ useI18n: () => ({ t: (text: string) => text }) }))
vi.mock('../hooks/useShowDiacritics', () => ({ useShowDiacritics: () => true }))
vi.mock('../data/db', () => ({
  getSetting: async (_key: string, fallback: unknown) => fallback,
  setSetting: vi.fn(),
  db: {
    quranBookmarks: {
      where: () => ({ equals: () => ({ toArray: async () => [...stores.saved.values()] }) }),
      put: async (item: { id: string }) => { stores.saved.set(item.id, item) },
      delete: async (id: string) => { stores.saved.delete(id) },
    },
    quranProgress: { put: stores.progress, get: async () => undefined },
  },
}))
const index: QuranIndex = { publisher: 'QuranEnc', sourceUrl: 'https://quranenc.com', ayahCount: 42, edition: { title: 'Test edition', version: '1', key: 'en' }, chapters: [{ id: 2, name: 'Al-Baqarah', arabic: 'البقرة', meaning: 'The Cow', count: 42 }] }
const dataset: QuranSura = { metadata: { publisher: 'QuranEnc', sourceUrl: 'https://quranenc.com', edition: index.edition }, result: Array.from({ length: 42 }, (_, i) => ({ id: String(i + 1), sura: '2', aya: String(i + 1), arabic_text: `نص الآية ${i + 1}`, translation: `Full translation of ayah ${i + 1}. ${'Long uncut reading. '.repeat(30)}End of ayah ${i + 1}.`, footnotes: '' })) }
vi.mock('../services/reading', () => ({ quranIndex: async () => index, quranSurah: async () => dataset }))

function open(ayah = 1) {
  return render(<MemoryRouter initialEntries={[`/quran/2?ayah=${ayah}`]}><BootProvider data={{ pathname: '/quran/2', quranIndex: index, quranSurah: dataset }}><Routes><Route path="/quran/:surah" element={<QuranPage/>}/></Routes></BootProvider></MemoryRouter>)
}
beforeEach(() => { stores.saved.clear(); stores.progress.mockReset().mockResolvedValue(undefined); Element.prototype.scrollIntoView = vi.fn() })
afterEach(cleanup)

test('reader shows 20 full ayahs, crosses the page boundary and retains the last ayah text', async () => {
  const { container } = open(20)
  await waitFor(() => expect(container.querySelectorAll('.quran-ayah')).toHaveLength(20))
  expect(container.querySelector('#ayah-20 .quran-translation')?.textContent).toContain('End of ayah 20.')
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(container.querySelector('#ayah-21')).toBeInTheDocument())
  expect(container.querySelectorAll('.quran-ayah')).toHaveLength(20)
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(container.querySelector('#ayah-42')).toBeInTheDocument())
  expect(container.querySelectorAll('.quran-ayah')).toHaveLength(2)
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  expect(container.querySelector('#ayah-42 .quran-translation')?.textContent).toContain('End of ayah 42.')
})

test('ayah bookmark survives leaving the reader and exact requested position is persisted', async () => {
  const view = open(21)
  await waitFor(() => expect(stores.progress).toHaveBeenCalledWith(expect.objectContaining({ surah: 2, ayah: 21 })))
  fireEvent.click(screen.getByRole('button', { name: 'Save ayah 2:21' }))
  await screen.findByRole('button', { name: 'Remove saved ayah 2:21' })
  expect(stores.saved.has('2:21')).toBe(true)
  view.unmount(); open(21)
  expect(await screen.findByRole('button', { name: 'Remove saved ayah 2:21' })).toHaveAttribute('aria-pressed', 'true')
})
