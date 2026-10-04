import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDataCache, loadChapter, loadTranslation } from './loader'

afterEach(() => {
  clearDataCache()
  vi.unstubAllGlobals()
})

describe('data loader', () => {
  it('loads and caches Arabic chapter datasets', async () => {
    const dataset = { metadata: { placeholder: true }, records: [{ id: 'placeholder-1', arabic: '[PLACEHOLDER Arabic text 1]' }] }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadChapter('nawawi-placeholder', 'chapter-1.json')).resolves.toEqual(dataset)
    await loadChapter('nawawi-placeholder', 'chapter-1.json')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/data/nawawi-placeholder/chapter-1.json')
  })

  it('loads translations from an independent language path', async () => {
    const dataset = { metadata: { contributor: 'Placeholder only' }, translations: { 'placeholder-1': { text: '[PLACEHOLDER translation 1]' } } }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(dataset), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadTranslation('en', 'nawawi-placeholder', 'chapter-1.json')).resolves.toEqual(dataset)
    expect(fetchMock).toHaveBeenCalledWith('/data/translations/en/nawawi-placeholder/chapter-1.json')
  })
})
