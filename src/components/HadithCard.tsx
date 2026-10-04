import { useEffect, useState } from 'react'
import { AlertCircle, Bookmark, Info, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type BookmarkFolder } from '../data/db'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'
import { shareHadithImage } from '../utils/shareImage'
import { SHOW_FEEDBACK } from '../config'

type Props = {
  hadith: HadithRecord
  translation?: Translation
  translationMetadata?: DatasetMetadata
  showDiacritics: boolean
  arabicSize: number
  collectionId: string
  chapterId: string
  language: string
  onOpenDetails: () => void
}

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali', hi: 'Hindi' }
const SOURCE_REFERENCE = /^\d+\s*\/\s*\d+\s*[-–—ـ]+\s*/u

function displaySourceText(value: string) {
  return value.replace(SOURCE_REFERENCE, '')
}

export function stripArabicDiacritics(value: string) {
  return value.replace(ARABIC_DIACRITICS, '')
}

export function HadithCard({ hadith, translation, translationMetadata, showDiacritics, arabicSize, collectionId, chapterId, language, onOpenDetails }: Props) {
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
      </header>

      <p className="arabic-text" dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}px` }}>{displaySourceText(arabic)}</p>

      {translation && translationMetadata && (
        <section className="translation-block" lang={language} dir={language === 'ur' ? 'rtl' : 'auto'}>
          <p>{displaySourceText(translation.text)}</p>
          <details className="translation-about">
            <summary><Info size={16} /> About this translation</summary>
            <div>
              <p><strong>Language:</strong> {LANGUAGE_NAMES[language] ?? language.toUpperCase()}</p>
              <p><strong>Translation source:</strong> {translationMetadata.sourceName}</p>
              <p>Not reviewed by this app's team.</p>
              <p><Link to="/sources">Sources</Link>{SHOW_FEEDBACK && <> · <Link to={`/feedback?type=mistake&hadith=${encodeURIComponent(hadith.id)}`}>Report an error</Link></>}</p>
            </div>
          </details>
        </section>
      )}

      {language !== 'ar' && !translation && <p className="notice">English translation is not available for this narration; the Arabic text above is from the source edition.</p>}

      <p className="hadeethenc-credit">Text source: {hadith.sourceName ?? translationMetadata?.sourceName ?? 'IslamHouse.com / IslamEnc.com'}</p>

      <footer className="hadith-footer">
        <div className="trust-summary">
          {hadith.grades.length > 0 ? hadith.grades.map((grade) => (
            <button className={`grade grade-button grade-${grade.grade.toLocaleLowerCase().replace(/[^a-z]+/g, '-')}`} key={`${grade.grader}-${grade.grade}`} onClick={onOpenDetails}>
              <AlertCircle size={15} /> {grade.grade} · per {grade.grader}
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
