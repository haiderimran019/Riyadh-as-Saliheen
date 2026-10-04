import MiniSearch from 'minisearch'
import type { HadithRecord } from '../types/hadith'
import { normalizeArabic } from './normalize'

export type SearchableHadith = HadithRecord & { collectionId: string; chapterId: string }

export function createHadithSearch(records: SearchableHadith[]) {
  const search = new MiniSearch<SearchableHadith>({
    fields: ['arabic', 'number', 'book', 'chapter', 'topicsText'],
    storeFields: ['id'],
    processTerm: (term) => normalizeArabic(term.toLocaleLowerCase()),
    searchOptions: { prefix: true, fuzzy: 0.15 },
  })
  search.addAll(records.map((record) => ({ ...record, topicsText: record.topics?.join(' ') ?? '' })))
  return search
}
