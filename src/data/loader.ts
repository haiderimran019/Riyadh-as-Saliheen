import { getDataRoot } from '../config'
import type {
  ArabicChapterDataset,
  ArabicRecordDataset,
  CollectionIndex,
  CollectionsManifest,
  SourcesManifest,
  TranslationChapterDataset,
} from '../types/hadith'
import type { SearchableHadith } from '../search'

const cache = new Map<string, unknown | Promise<unknown>>()

async function loadJson<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const pending = fetch(`${getDataRoot()}/${path}`, { signal: AbortSignal.timeout(12_000) })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load data (${response.status})`)
      return response.json() as Promise<T>
    })
    .then((value) => {
      cache.set(path, value)
      return value
    })
    .catch((error: unknown) => {
      cache.delete(path)
      throw error
    })
  cache.set(path, pending)
  return pending as Promise<T>
}

export const loadCollections = () => loadJson<CollectionsManifest>('collections.json')
export const loadSources = () => loadJson<SourcesManifest>('sources.json')

export const loadCollection = (collectionId: string) =>
  loadJson<CollectionIndex>(`${collectionId}/index.json`)

export const loadChapter = (collectionId: string, file: string) =>
  loadJson<ArabicChapterDataset>(`${collectionId}/${file}`)

export const loadHadithRecord = (collectionId: string, id: string) =>
  loadJson<ArabicRecordDataset>(`${collectionId}/records/${encodeURIComponent(id)}.json`)

export const loadTranslation = (language: string, collectionId: string, file: string) =>
  loadJson<TranslationChapterDataset>(`translations/${language}/${collectionId}/${file}`)

export const loadAllTranslations = (language: string, collectionId: string) =>
  loadJson<TranslationChapterDataset>(`translations/${language}/${collectionId}/all.json`)

export async function loadAllHadith(): Promise<SearchableHadith[]> {
  const manifest = await loadCollections()
  const collections = await Promise.all(manifest.collections.map(({ id }) => loadCollection(id)))
  const chapters = await Promise.all(collections.flatMap((collection) =>
    collection.allFile ? [loadChapter(collection.id, collection.allFile).then((dataset) => dataset.records.map((record) => ({ ...record, collectionId: collection.id, chapterId: record.chapter || record.topics?.[0] || collection.chapters[0]?.id || '' })))] : collection.chapters.map(async (chapter) => {
      const dataset = await loadChapter(collection.id, chapter.file)
      return dataset.records.map((record) => ({ ...record, collectionId: collection.id, chapterId: chapter.id }))
    }),
  ))
  return chapters.flat()
}

export function clearDataCache() {
  cache.clear()
}
