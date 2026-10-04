import { DATA_ROOT } from '../config'
import type {
  ArabicChapterDataset,
  CollectionIndex,
  CollectionsManifest,
  SourcesManifest,
  TranslationChapterDataset,
} from '../types/hadith'

const cache = new Map<string, unknown>()

async function loadJson<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const response = await fetch(`${DATA_ROOT}/${path}`)
  if (!response.ok) throw new Error(`Unable to load data: ${response.status}`)
  const value = (await response.json()) as T
  cache.set(path, value)
  return value
}

export const loadCollections = () => loadJson<CollectionsManifest>('collections.json')
export const loadSources = () => loadJson<SourcesManifest>('sources.json')

export const loadCollection = (collectionId: string) =>
  loadJson<CollectionIndex>(`${collectionId}/index.json`)

export const loadChapter = (collectionId: string, file: string) =>
  loadJson<ArabicChapterDataset>(`${collectionId}/${file}`)

export const loadTranslation = (language: string, collectionId: string, file: string) =>
  loadJson<TranslationChapterDataset>(`translations/${language}/${collectionId}/${file}`)

export function clearDataCache() {
  cache.clear()
}
