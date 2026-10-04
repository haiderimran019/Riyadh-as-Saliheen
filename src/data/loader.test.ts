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
    expect(fetchMock).toHaveBeenCalledWith('/data-local/generated/test-collection/chapter-1.json')
  })

  it('loads translations from an independent language path', async () => {
    const dataset = { metadata: { sourceName: 'test' }, translations: { 'test-1': { text: '' } } }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadTranslation('en', 'test-collection', 'chapter-1.json')).resolves.toEqual(dataset)
    expect(fetchMock).toHaveBeenCalledWith('/data-local/generated/translations/en/test-collection/chapter-1.json')
  })
})
