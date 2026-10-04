import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDataCache, loadChapter, loadTranslation } from './loader'

afterEach(() => {
  clearDataCache()
  vi.unstubAllGlobals()
})

describe('data loader', () => {
  it('loads and caches Arabic chapter datasets', async () => {
    const dataset = { metadata: { sourceName: 'test' }, records: [{ id: 'test-1', arabic: '' }] }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadChapter('test-collection', 'chapter-1.json')).resolves.toEqual(dataset)
    await loadChapter('test-collection', 'chapter-1.json')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/data/test-collection/chapter-1.json', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('loads translations from an independent language path', async () => {
    const dataset = { metadata: { sourceName: 'test' }, translations: { 'test-1': { text: '' } } }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadTranslation('en', 'test-collection', 'chapter-1.json')).resolves.toEqual(dataset)
    expect(fetchMock).toHaveBeenCalledWith('/data/translations/en/test-collection/chapter-1.json', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it('shares an in-flight request and retries after a failure', async () => {
    const dataset = { metadata: { sourceName: 'test' }, records: [] }
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadChapter('test-collection', 'chapter-1.json')).rejects.toThrow('offline')
    const first = loadChapter('test-collection', 'chapter-1.json')
    const second = loadChapter('test-collection', 'chapter-1.json')
    await expect(Promise.all([first, second])).resolves.toEqual([dataset, dataset])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
