import { useEffect, useState } from 'react'
import { AlertCircle, Bookmark, Share2 } from 'lucide-react'
import { db, type BookmarkFolder } from '../data/db'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'
import { shareHadithImage } from '../utils/shareImage'

type Props = {
  hadith: HadithRecord
  translation?: Translation
  translationMetadata?: DatasetMetadata
  showDiacritics: boolean
  arabicSize: number
  collectionId: string
  chapterId: string
  onOpenDetails: () => void
}

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function stripArabicDiacritics(value: string) {
  return value.replace(ARABIC_DIACRITICS, '')
}

export function HadithCard({ hadith, translation, translationMetadata, showDiacritics, arabicSize, collectionId, chapterId, onOpenDetails }: Props) {
  const [saved, setSaved] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const arabic = showDiacritics ? hadith.arabic : stripArabicDiacritics(hadith.arabic)

  useEffect(() => {
    Promise.all([db.bookmarks.get(hadith.id), db.folders.orderBy('createdAt').toArray()]).then(([bookmark, values]) => {
      setSaved(Boolean(bookmark))
      setFolderId(bookmark?.folderId ?? '')
      setFolders(values)
    })
  }, [hadith.id])

  const toggleBookmark = async () => {
    if (saved) {
      await db.bookmarks.delete(hadith.id)
      setSaved(false)
      setFolderId('')
    } else {
      await db.bookmarks.put({ hadithId: hadith.id, collectionId, chapterId, createdAt: Date.now() })
      setSaved(true)
    }
  }

  const moveBookmark = async (nextFolderId: string) => {
    const bookmark = await db.bookmarks.get(hadith.id)
    if (!bookmark) return
    await db.bookmarks.put({ ...bookmark, folderId: nextFolderId || undefined })
    setFolderId(nextFolderId)
  }

  return (
    <article className="hadith-card" id={hadith.id}>
      <header className="hadith-meta">
        <div>
          <span className="hadith-number">Hadith {hadith.number}</span>
          <p>{hadith.collection} · {hadith.book} · Chapter {hadith.chapter}</p>
        </div>
        {hadith.placeholder && <span className="placeholder-badge">Placeholder</span>}
      </header>

      <p className="arabic-text" dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}rem` }}>{arabic}</p>

      {translation && translationMetadata && (
        <section className="translation-block" lang="en">
          <p>{translation.text}</p>
          <small>
            Translation credit: {translationMetadata.sourceName} · {translationMetadata.contributorRole}: {translationMetadata.contributor} · {translationMetadata.license}
          </small>
        </section>
      )}

      <footer className="hadith-footer">
        <div className="trust-summary">
          {hadith.grades.length > 0 ? hadith.grades.map((grade) => (
            <button className={`grade grade-button grade-${grade.grade.toLocaleLowerCase().replace(/[^a-z]+/g, '-')}`} key={`${grade.grader}-${grade.grade}`} onClick={onOpenDetails}>
              <AlertCircle size={15} /> {grade.grade} · graded by {grade.grader}
            </button>
          )) : (
            <button className="grade grade-button unavailable" onClick={onOpenDetails}><AlertCircle size={15} /> Grade not available</button>
          )}
          <span className="reference">Reference: {hadith.collection}, no. {hadith.number}</span>
        </div>
        <div className="save-controls">
          {saved && folders.length > 0 && (
            <select aria-label={`Folder for hadith ${hadith.number}`} value={folderId} onChange={(event) => moveBookmark(event.target.value)}>
              <option value="">No folder</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          )}
          <button className="bookmark-button" aria-pressed={saved} onClick={toggleBookmark}>
            <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
          </button>
          <button className="details-button" onClick={onOpenDetails}>Details</button>
          <button className="share-button" aria-label={`Share hadith ${hadith.number} as an image`} onClick={() => void shareHadithImage(hadith, translation, translationMetadata)}><Share2 size={17} /></button>
        </div>
      </footer>
    </article>
  )
}
