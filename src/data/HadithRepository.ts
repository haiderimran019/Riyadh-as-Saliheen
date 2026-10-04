import { DEFAULT_COLLECTION } from '../config'
import { selectDailyIndex } from '../utils/dailyHadith'
import { loadAllHadith, loadChapter, loadCollection, loadCollections, loadHadithRecord, loadSources, loadTranslation } from './loader'

export interface HadithDataAdapter {
  listCollections: typeof loadCollections
  getCollection: typeof loadCollection
  getChapter: typeof loadChapter
  getTranslation: typeof loadTranslation
  getSources: typeof loadSources
  getAllHadith: typeof loadAllHadith
  getDailyHadith: (date: Date) => Promise<Awaited<ReturnType<typeof loadAllHadith>>[number] | undefined>
}

export class HadeethEncJsonAdapter implements HadithDataAdapter {
  listCollections = loadCollections
  getCollection = loadCollection
  getChapter = loadChapter
  getTranslation = loadTranslation
  getSources = loadSources
  getAllHadith = loadAllHadith

  async getDailyHadith(date: Date) {
    const collection = await loadCollection(DEFAULT_COLLECTION)
    const recordIds = collection.recordIds ?? []
    const dailyId = recordIds[selectDailyIndex(recordIds.length, date)]
    if (!dailyId) {
      const records = await loadAllHadith()
      return records[selectDailyIndex(records.length, date)]
    }
    const dataset = await loadHadithRecord(collection.id, dailyId)
    return { ...dataset.record, collectionId: collection.id, chapterId: dataset.record.topics?.[0] ?? collection.chapters[0]?.id ?? '' }
  }
}

export class HadithRepository {
  constructor(private readonly adapter: HadithDataAdapter) {}

  listCollections() { return this.adapter.listCollections() }
  getCollection(id: string) { return this.adapter.getCollection(id) }
  getChapter(collectionId: string, file: string) { return this.adapter.getChapter(collectionId, file) }
  getTranslation(language: string, collectionId: string, file: string) { return this.adapter.getTranslation(language, collectionId, file) }
  getSources() { return this.adapter.getSources() }
  getAllHadith() { return this.adapter.getAllHadith() }
  getDailyHadith(date: Date) { return this.adapter.getDailyHadith(date) }
}

export const hadithRepository = new HadithRepository(new HadeethEncJsonAdapter())
