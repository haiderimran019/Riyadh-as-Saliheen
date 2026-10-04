import Dexie, { type EntityTable } from 'dexie'

export type Bookmark = {
  hadithId: string
  collectionId: string
  chapterId: string
  folderId?: string
  createdAt: number
}

export type BookmarkFolder = {
  id: string
  name: string
  createdAt: number
}

export type ReadingProgress = {
  collectionId: string
  chapterId: string
  hadithId: string
  updatedAt: number
}

export type StoredSetting = {
  key: string
  value: string | number | boolean
}

class HadithDatabase extends Dexie {
  bookmarks!: EntityTable<Bookmark, 'hadithId'>
  folders!: EntityTable<BookmarkFolder, 'id'>
  progress!: EntityTable<ReadingProgress, 'collectionId'>
  settings!: EntityTable<StoredSetting, 'key'>

  constructor() {
    super('hadith-app')
    this.version(1).stores({
      bookmarks: 'hadithId, collectionId, chapterId, folderId, createdAt',
      folders: 'id, name, createdAt',
      progress: 'collectionId, updatedAt',
      settings: 'key',
    })
  }
}

export const db = new HadithDatabase()

export async function getSetting<T extends StoredSetting['value']>(key: string, fallback: T): Promise<T> {
  const setting = await db.settings.get(key)
  return (setting?.value as T | undefined) ?? fallback
}

export async function setSetting(key: string, value: StoredSetting['value']) {
  await db.settings.put({ key, value })
}
