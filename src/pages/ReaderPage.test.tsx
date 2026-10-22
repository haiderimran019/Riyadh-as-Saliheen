import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BootProvider } from '../ssr/BootData'
import { ReaderPage } from './ReaderPage'
import type { ArabicChapterDataset, CollectionIndex } from '../types/hadith'

const calls = vi.hoisted(() => ({ collection: vi.fn(), chapter: vi.fn(), progress: vi.fn() }))
vi.mock('../data/HadithRepository', () => ({ hadithRepository: { getCollection: calls.collection, getChapter: calls.chapter, getTranslation: async () => ({ metadata: {}, translations: {} }) } }))
vi.mock('../data/db', () => ({ db: { progress: { put: calls.progress } }, getSetting: async (_key: string, fallback: unknown) => fallback }))
vi.mock('../i18n', () => ({ useI18n: () => ({ language: 'en', t: (text: string) => text }) }))
vi.mock('../components/HadithCard', () => ({ HadithCard: ({ hadith }: { hadith: { id: string } }) => <article id={hadith.id}>Reading {hadith.id}</article> }))

afterEach(cleanup)

test('a cached chapter refresh cannot reset an exact saved return link to the first hadith', async () => {
  const metadata = { sourceName: 'Test', sourceUrl: 'https://example.test', contributor: 'Test', contributorRole: 'editor' as const, license: 'test', dateRetrieved: '2026-10-22' }
  const collection: CollectionIndex = { id: 'riyad-as-salihin', title: 'Riyad', description: 'Test', languages: ['en'], metadata, chapters: [{ id: '1', title: 'Intention', file: '1.json', count: 2 }] }
  const chapter: ArabicChapterDataset = { metadata, records: [1, 2].map(number => ({ id: `${number}-1`, collection: 'riyad-as-salihin', book: '1', chapter: '1', number: String(number), arabic: 'نص', grades: [], references: [] })) }
  let finishCollection!: (value: CollectionIndex) => void
  calls.collection.mockImplementation(() => new Promise<CollectionIndex>(resolve => { finishCollection = resolve }))
  calls.chapter.mockResolvedValue(chapter)
  calls.progress.mockResolvedValue(undefined)
  render(<MemoryRouter initialEntries={['/collection/riyad-as-salihin/chapter/1?hadith=2-1#2-1']}><BootProvider data={{ pathname: '/quran', collection }}><Routes><Route path="/collection/:collectionId/chapter/:chapterId" element={<ReaderPage/>}/></Routes></BootProvider></MemoryRouter>)
  expect(await screen.findByText('Reading 2-1')).toBeInTheDocument()
  await act(async () => { finishCollection({ ...collection, chapters: collection.chapters.map(item => ({ ...item })) }); await Promise.resolve() })
  await waitFor(() => expect(calls.chapter).toHaveBeenCalledTimes(2))
  expect(screen.getByText('Reading 2-1')).toBeInTheDocument()
  expect(screen.queryByText('Reading 1-1')).not.toBeInTheDocument()
  expect(calls.progress).not.toHaveBeenCalledWith(expect.objectContaining({ hadithId: '1-1' }))
})
