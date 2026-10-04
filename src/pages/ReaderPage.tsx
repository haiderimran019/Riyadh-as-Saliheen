import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Minus, Plus, Type, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { HadithCard } from '../components/HadithCard'
import { db, getSetting, setSetting } from '../data/db'
import { loadChapter, loadCollection, loadTranslation } from '../data/loader'
import type { ArabicChapterDataset, CollectionIndex, HadithRecord, TranslationChapterDataset } from '../types/hadith'

type TrustFilter = 'sahih' | 'sahih-hasan' | 'all'

const gradeCategory = (grade: string) => {
  const value = grade.toLocaleLowerCase()
  if (value.includes('sahih') || value.includes('authentic')) return 'sahih'
  if (value.includes('hasan') || value.includes('good')) return 'hasan'
  return 'other'
}

const gradeExplanation = (grade: string) => {
  const category = gradeCategory(grade)
  if (category === 'sahih') return 'The named grader classified this report as sound under their methodology.'
  if (category === 'hasan') return 'The named grader classified this report as good under their methodology.'
  return 'This is the exact label recorded by the source. Consult that source for the grader’s methodology.'
}

export function ReaderPage() {
  const { collectionId = '', chapterId = '' } = useParams()
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [chapter, setChapter] = useState<ArabicChapterDataset | null>(null)
  const [translation, setTranslation] = useState<TranslationChapterDataset | null>(null)
  const [language, setLanguage] = useState('')
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(2.2)
  const [trustFilter, setTrustFilter] = useState<TrustFilter>('all')
  const [selectedHadith, setSelectedHadith] = useState<HadithRecord | null>(null)
  const [contextOpen, setContextOpen] = useState(false)
  const [error, setError] = useState('')

  const chapterIndex = useMemo(
    () => collection?.chapters.find((candidate) => candidate.id === chapterId),
    [collection, chapterId],
  )

  const visibleRecords = useMemo(() => (chapter?.records ?? []).filter((hadith) => {
    if (trustFilter === 'all') return true
    const categories = hadith.grades.map((grade) => gradeCategory(grade.grade))
    return trustFilter === 'sahih' ? categories.includes('sahih') : categories.some((value) => value === 'sahih' || value === 'hasan')
  }), [chapter, trustFilter])

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
      .then((value) => {
        setChapter(value)
        setSelectedHadith(value.records[0] ?? null)
      })
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
      const record = chapter.records.find((candidate) => candidate.id === visible.target.id)
      if (record) setSelectedHadith(record)
      void db.progress.put({ collectionId, chapterId, hadithId: visible.target.id, updatedAt: Date.now() })
    }, { threshold: [0.55, 0.8] })
    targets.forEach((target) => observer.observe(target))
    const hashTarget = window.location.hash ? document.querySelector(window.location.hash) : null
    hashTarget?.scrollIntoView({ block: 'start' })
    return () => observer.disconnect()
  }, [chapter, chapterId, collectionId, visibleRecords])

  const openContext = (hadith: HadithRecord) => {
    setSelectedHadith(hadith)
    setContextOpen(true)
  }

  return (
    <main className="reader-page page-with-nav three-pane-page">
      <aside className="browse-pane" aria-label="Browse chapters">
        <Link className="back-link" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> Collection</Link>
        <p className="pane-label">Chapters</p>
        <nav>
          {collection?.chapters.map((item) => (
            <Link data-active={item.id === chapterId} key={item.id} to={`/collection/${collectionId}/chapter/${item.id}`}>
              <span>{item.id.padStart(2, '0')}</span>{item.title}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="read-pane">
        <div className="reader-heading">
          <Link className="back-link mobile-reader-back" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> All chapters</Link>
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
          <label className="trust-control">
            <span>Trust filter</span>
            <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value as TrustFilter)}>
              <option value="sahih">Sahih only</option>
              <option value="sahih-hasan">Sahih + Hasan</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>

        {error && <p className="notice error">{error}</p>}
        {visibleRecords.length === 0 && chapter && (
          <p className="empty-state">No records match this trust filter. Missing grades are never inferred.</p>
        )}
        <section className="hadith-list" aria-live="polite">
          {visibleRecords.map((hadith) => (
            <HadithCard
              key={hadith.id}
              hadith={hadith}
              translation={translation?.translations[hadith.id]}
              translationMetadata={translation?.metadata}
              showDiacritics={showDiacritics}
              arabicSize={arabicSize}
              collectionId={collectionId}
              chapterId={chapterId}
              onOpenDetails={() => openContext(hadith)}
            />
          ))}
        </section>
      </section>

      <aside className={`context-pane ${contextOpen ? 'open' : ''}`} aria-label="Hadith grading and references">
        <button className="context-close" onClick={() => setContextOpen(false)} aria-label="Close details"><X size={19} /></button>
        <p className="pane-label">Context</p>
        {selectedHadith ? (
          <div className="context-content">
            <span className="context-number">Hadith {selectedHadith.number}</span>
            <section>
              <h2>Grading</h2>
              {selectedHadith.grades.length > 0 ? selectedHadith.grades.map((grade) => (
                <div className={`grade-detail ${gradeCategory(grade.grade)}`} key={`${grade.grader}-${grade.grade}`}>
                  <strong><CheckCircle2 size={17} /> {grade.grade}</strong>
                  <span>Graded by {grade.grader}</span>
                  <p>{grade.note ?? gradeExplanation(grade.grade)}</p>
                </div>
              )) : (
                <div className="grade-detail unavailable">
                  <strong>Grade not available</strong>
                  <p>The imported record does not contain a grade or grader. The app does not infer one.</p>
                </div>
              )}
            </section>
            <section>
              <h2>References</h2>
              {selectedHadith.references.length > 0 ? selectedHadith.references.map((reference) => (
                <p className="context-reference" key={`${reference.collection}-${reference.number}`}>{reference.collection}<strong>No. {reference.number}</strong></p>
              )) : <p className="context-muted">References not available.</p>}
            </section>
            <section>
              <h2>Record location</h2>
              <p className="context-muted">{selectedHadith.collection}<br />{selectedHadith.book}<br />Chapter {selectedHadith.chapter}</p>
            </section>
          </div>
        ) : <p className="context-muted">Select a hadith to see its details.</p>}
      </aside>
      {contextOpen && <button className="sheet-backdrop" aria-label="Close details" onClick={() => setContextOpen(false)} />}
    </main>
  )
}
