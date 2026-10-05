import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Search, Type, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { HadithCard } from '../components/HadithCard'
import type { ReadingPreferences } from '../components/ReadingControlsSheet'
import { db, getSetting, setSetting } from '../data/db'
import { getDataRoot } from '../config'
import { hadithRepository } from '../data/HadithRepository'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
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
  const [language, setLanguage] = useState('en')
  const [offlineStatus, setOfflineStatus] = useState('')
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(38)
  const [trustFilter, setTrustFilter] = useState<TrustFilter>('all')
  const [selectedHadith, setSelectedHadith] = useState<HadithRecord | null>(null)
  const [contextOpen, setContextOpen] = useState(false)
  const [error, setError] = useState('')
  const [chapterLoading, setChapterLoading] = useState(true)
  const [collectionLoading, setCollectionLoading] = useState(true)

  const chapterIndex = useMemo(
    () => collection?.chapters.find((candidate) => candidate.id === chapterId),
    [collection, chapterId],
  )

  const visibleRecords = useMemo(() => (chapter?.records ?? []).filter((hadith) => {
    if (trustFilter === 'all') return true
    const categories = hadith.grades.map((grade) => gradeCategory(grade.grade))
    return trustFilter === 'sahih' ? categories.includes('sahih') : categories.some((value) => value === 'sahih' || value === 'hasan')
  }), [chapter, trustFilter])
  const hasGrades = chapter?.records.some((record) => record.grades.length > 0) ?? false

  useEffect(() => { if (chapter && !hasGrades) setTrustFilter('all') }, [chapter, hasGrades])

  useEffect(() => {
    setError('')
    setCollectionLoading(true)
    setCollection(null)
    Promise.all([getSetting('showDiacritics', true), getSetting('arabicSizePx', window.matchMedia('(min-width: 721px)').matches ? 38 : 34)]).then(([diacritics, size]) => {
      setShowDiacritics(diacritics)
      setArabicSize(size)
    })
    Promise.all([hadithRepository.getCollection(collectionId), getSetting('language', 'en')])
      .then(([value, preferredLanguage]) => {
        setCollection(value)
        const available = ['ar', ...value.languages]
        setLanguage(available.includes(preferredLanguage) ? preferredLanguage : available.includes('en') ? 'en' : 'ar')
      })
      .catch(() => setError('The reading data is not available in this preview yet.'))
      .finally(() => setCollectionLoading(false))
  }, [collectionId])

  useEffect(() => {
    const update = (event: Event) => {
      const preferred = (event as CustomEvent<string>).detail
      const available = ['ar', ...(collection?.languages ?? [])]
      setLanguage(available.includes(preferred) ? preferred : available.includes('en') ? 'en' : 'ar')
    }
    window.addEventListener(APP_EVENTS.languageChange, update)
    return () => window.removeEventListener(APP_EVENTS.languageChange, update)
  }, [collection])

  useEffect(() => {
    const update = (event: Event) => {
      const preferences = (event as CustomEvent<ReadingPreferences>).detail
      setShowDiacritics(preferences.showDiacritics)
      setArabicSize(preferences.arabicSize)
    }
    window.addEventListener(APP_EVENTS.readingPreferencesChange, update)
    return () => window.removeEventListener(APP_EVENTS.readingPreferencesChange, update)
  }, [])

  useEffect(() => {
    if (!chapterIndex) {
      if (!collectionLoading) setChapterLoading(false)
      return
    }
    let active = true
    setChapterLoading(true)
    setChapter(null)
    hadithRepository.getChapter(collectionId, chapterIndex.file)
      .then((value) => {
        if (!active) return
        setChapter(value)
        setSelectedHadith(value.records[0] ?? null)
      })
      .catch(() => { if (active) setError('This chapter could not be loaded. Check your connection and try again.') })
      .finally(() => { if (active) setChapterLoading(false) })
    return () => { active = false }
  }, [chapterIndex, collectionId, collectionLoading])

  useEffect(() => {
    if (!chapterIndex || !language || language === 'ar') {
      setTranslation(null)
      return
    }
    let active = true
    setTranslation(null)
    hadithRepository.getTranslation(language, collectionId, chapterIndex.file)
      .then(async (selected) => {
        if (!active) return
        const selectedTranslations = Object.fromEntries(Object.entries(selected.translations).map(([id, value]) => [id, { ...value, language }]))
        const missingIds = (chapter?.records ?? []).filter((record) => !selected.translations[record.id]).map((record) => record.id)
        if (language === 'en' || missingIds.length === 0) {
          if (active) setTranslation({ ...selected, translations: selectedTranslations })
          return
        }
        const english = await hadithRepository.getTranslation('en', collectionId, chapterIndex.file).catch(() => null)
        const englishFallbacks = Object.fromEntries(Object.entries(english?.translations ?? {}).filter(([id]) => missingIds.includes(id)).map(([id, value]) => [id, { ...value, language: 'en' }]))
        if (active) setTranslation({ ...selected, translations: { ...englishFallbacks, ...selectedTranslations } })
      })
      .catch(() => { if (active) setTranslation(null) })
    return () => { active = false }
  }, [chapter, chapterIndex, collectionId, language])

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
    const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null
    hashTarget?.scrollIntoView({ block: 'start' })
    return () => observer.disconnect()
  }, [chapter, chapterId, collectionId, visibleRecords])

  const openContext = (hadith: HadithRecord) => {
    setSelectedHadith(hadith)
    setContextOpen(true)
  }

  const downloadLanguage = async () => {
    if (!collection || language === 'ar') return
    setOfflineStatus('Downloading…')
    try {
      for (let index = 0; index < collection.chapters.length; index += 6) {
        await Promise.all(collection.chapters.slice(index, index + 6).map((chapterItem) => fetch(`${getDataRoot()}/translations/${language}/${collectionId}/${chapterItem.file}`).then((response) => {
          if (!response.ok) throw new Error(String(response.status))
          return response.arrayBuffer()
        })))
      }
      setOfflineStatus('Available offline')
    } catch {
      setOfflineStatus('Download failed')
    }
  }

  const renderHadith = (hadith: HadithRecord) => (
    <HadithCard
      key={hadith.id}
      hadith={hadith}
      translation={translation?.translations[hadith.id]}
      translationMetadata={translation?.metadata}
      showDiacritics={showDiacritics}
      arabicSize={arabicSize}
      collectionId={collectionId}
      chapterId={chapterId}
      language={translation?.translations[hadith.id]?.language ?? language}
      onOpenDetails={() => openContext(hadith)}
    />
  )

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
          <div className="reader-crumbs"><Link className="back-link mobile-reader-back" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> All chapters</Link><Link className="reader-search-link" to="/search"><Search size={17} /> Search</Link></div>
          <div>
            <p className="eyebrow">Riyad as-Salihin / Chapter {chapterId}</p>
            <h1>{chapterIndex?.title.replace(/^\d+\s*[-–—]\s*/, '') ?? (collectionLoading ? 'Opening the collection…' : 'Chapter unavailable')}</h1>
            <span className="reader-chapter-count">{chapterIndex?.count ?? 0} hadith · Arabic with English translation</span>
          </div>
        </div>

        <div className="reader-toolbar" aria-label="Reader controls">
          <div className="reader-toolbar-head"><button className="open-reading-controls" aria-label="Open reading display settings" onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}><Type size={17} /> Display</button></div>
          {collection && collection.languages.length > 0 && (
            <label className="language-control">
              <span>Translation</span>
              <select value={language} onChange={(event) => { setLanguage(event.target.value); void setSetting('language', event.target.value); dispatchAppEvent(APP_EVENTS.languageChange, event.target.value) }}>
                {['ar', ...collection.languages].map((code) => <option key={code} value={code}>{collection.languageNames?.[code] ?? code.toUpperCase()}</option>)}
              </select>
            </label>
          )}
          {hasGrades && <label className="trust-control">
            <span>Grade filter</span>
            <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value as TrustFilter)}>
              <option value="sahih">Sahih only</option>
              <option value="sahih-hasan">Sahih + Hasan</option>
              <option value="all">All</option>
            </select>
          </label>}
          {collection && language !== 'ar' && <button className="offline-button" onClick={() => void downloadLanguage()}>{offlineStatus || 'Offline text'}</button>}
        </div>

        {error && <p className="notice error" role="alert">{error}</p>}
        {chapterLoading && <div className="reader-loading" role="status"><span className="loading-dot" /> Preparing this chapter…</div>}
        {visibleRecords.length === 0 && chapter && (
          <p className="empty-state">No records match this trust filter. Missing grades are never inferred.</p>
        )}
        <section className="hadith-list" aria-live="polite">
          {visibleRecords.map(renderHadith)}
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
