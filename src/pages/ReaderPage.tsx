import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Minus, Plus, Type } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { HadithCard } from '../components/HadithCard'
import { db, getSetting, setSetting } from '../data/db'
import { loadChapter, loadCollection, loadTranslation } from '../data/loader'
import type { ArabicChapterDataset, CollectionIndex, TranslationChapterDataset } from '../types/hadith'

export function ReaderPage() {
  const { collectionId = '', chapterId = '' } = useParams()
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [chapter, setChapter] = useState<ArabicChapterDataset | null>(null)
  const [translation, setTranslation] = useState<TranslationChapterDataset | null>(null)
  const [language, setLanguage] = useState('')
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(2.2)
  const [error, setError] = useState('')

  const chapterIndex = useMemo(
    () => collection?.chapters.find((candidate) => candidate.id === chapterId),
    [collection, chapterId],
  )

  useEffect(() => {
    setError('')
    Promise.all([getSetting('showDiacritics', true), getSetting('arabicSize', 2.2)]).then(([diacritics, size]) => {
      setShowDiacritics(diacritics)
      setArabicSize(size)
    })
    loadCollection(collectionId)
      .then((value) => {
        setCollection(value)
        setLanguage(value.languages[0] ?? '')
      })
      .catch((reason: Error) => setError(reason.message))
  }, [collectionId])

  useEffect(() => {
    if (!chapterIndex) return
    loadChapter(collectionId, chapterIndex.file)
      .then(setChapter)
      .catch((reason: Error) => setError(reason.message))
  }, [chapterIndex, collectionId])

  useEffect(() => {
    if (!chapterIndex || !language) {
      setTranslation(null)
      return
    }
    loadTranslation(language, collectionId, chapterIndex.file)
      .then(setTranslation)
      .catch(() => setTranslation(null))
  }, [chapterIndex, collectionId, language])

  useEffect(() => {
    if (!chapter) return
    const targets = document.querySelectorAll<HTMLElement>('.hadith-card')
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!visible) return
      void db.progress.put({ collectionId, chapterId, hadithId: visible.target.id, updatedAt: Date.now() })
    }, { threshold: [0.55, 0.8] })
    targets.forEach((target) => observer.observe(target))
    const hashTarget = window.location.hash ? document.querySelector(window.location.hash) : null
    hashTarget?.scrollIntoView({ block: 'start' })
    return () => observer.disconnect()
  }, [chapter, chapterId, collectionId])

  return (
    <main className="reader-page page-with-nav">
      <div className="reader-heading">
        <Link className="back-link" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> All chapters</Link>
        <div>
          <p className="eyebrow">Chapter {chapterId}</p>
          <h1>{chapterIndex?.title ?? 'Loading chapter…'}</h1>
        </div>
      </div>

      <div className="reader-toolbar" aria-label="Reader controls">
        <label className="toggle-control">
          <input type="checkbox" checked={showDiacritics} onChange={(event) => { setShowDiacritics(event.target.checked); void setSetting('showDiacritics', event.target.checked) }} />
          <span>Tashkeel</span>
        </label>
        <div className="font-control" aria-label="Arabic font size">
          <Type size={17} aria-hidden="true" />
          <button aria-label="Decrease Arabic font size" onClick={() => setArabicSize((value) => { const next = Math.max(1.6, value - 0.2); void setSetting('arabicSize', next); return next })}><Minus size={16} /></button>
          <button aria-label="Increase Arabic font size" onClick={() => setArabicSize((value) => { const next = Math.min(3.4, value + 0.2); void setSetting('arabicSize', next); return next })}><Plus size={16} /></button>
        </div>
        {collection && collection.languages.length > 0 && (
          <label className="language-control">
            <span>Translation</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {collection.languages.map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}
            </select>
          </label>
        )}
      </div>

      {error && <p className="notice error">{error}</p>}
      <section className="hadith-list" aria-live="polite">
        {chapter?.records.map((hadith) => (
          <HadithCard
            key={hadith.id}
            hadith={hadith}
            translation={translation?.translations[hadith.id]}
            translationMetadata={translation?.metadata}
            showDiacritics={showDiacritics}
            arabicSize={arabicSize}
            collectionId={collectionId}
            chapterId={chapterId}
          />
        ))}
      </section>
    </main>
  )
}
