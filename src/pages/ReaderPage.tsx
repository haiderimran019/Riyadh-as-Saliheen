import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Type } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { HadithCard } from '../components/HadithCard'
import type { ReadingPreferences } from '../components/ReadingControlsSheet'
import { db, getSetting, setSetting } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import type { ArabicChapterDataset, CollectionIndex, HadithRecord, TranslationChapterDataset } from '../types/hadith'
import { useI18n } from '../i18n'
import { getChapterTitle } from '../utils/chapterTitle'

type TrustFilter = 'sahih' | 'sahih-hasan' | 'all'
const getDefaultArabicSize = () => window.matchMedia('(min-width: 721px)').matches ? 34 : 30

const gradeCategory = (grade: string) => {
  const value = grade.toLocaleLowerCase()
  if (value.includes('sahih') || value.includes('authentic')) return 'sahih'
  if (value.includes('hasan') || value.includes('good')) return 'hasan'
  return 'other'
}

export function ReaderPage() {
  const { language: appLanguage, t } = useI18n()
  const { collectionId = '', chapterId = '' } = useParams()
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [chapter, setChapter] = useState<ArabicChapterDataset | null>(null)
  const [translation, setTranslation] = useState<TranslationChapterDataset | null>(null)
  const [language, setLanguage] = useState('en')
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(getDefaultArabicSize)
  const [trustFilter, setTrustFilter] = useState<TrustFilter>('all')
  const [currentReadingPosition, setCurrentReadingPosition] = useState(1)
  const [error, setError] = useState('')
  const [chapterLoading, setChapterLoading] = useState(true)
  const [collectionLoading, setCollectionLoading] = useState(true)

  const chapterIndex = useMemo(
    () => collection?.chapters.find((candidate) => candidate.id === chapterId),
    [collection, chapterId],
  )
  const chapterOrdinal = collection?.chapters.findIndex((candidate) => candidate.id === chapterId) ?? -1
  const previousChapter = chapterOrdinal > 0 ? collection?.chapters[chapterOrdinal - 1] : undefined
  const nextChapter = chapterOrdinal >= 0 ? collection?.chapters[chapterOrdinal + 1] : undefined

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
    Promise.all([getSetting('showDiacritics', true), getSetting('arabicSizePx', getDefaultArabicSize())]).then(([diacritics, size]) => {
      setShowDiacritics(diacritics)
      setArabicSize(size)
    })
    Promise.all([hadithRepository.getCollection(collectionId), getSetting<'en' | 'ur'>('appLanguage', 'en')])
      .then(([value, preferredLanguage]) => {
        setCollection(value)
        setLanguage(value.languages.includes(preferredLanguage) ? preferredLanguage : preferredLanguage === 'ur' ? 'ar' : value.languages.includes('en') ? 'en' : 'ar')
      })
      .catch(() => setError('The reading data is not available in this preview yet.'))
      .finally(() => setCollectionLoading(false))
  }, [collectionId])

  useEffect(() => {
    const update = (event: Event) => {
      const preferred = (event as CustomEvent<'en' | 'ur'>).detail
      const available = collection?.languages ?? []
      setLanguage(available.includes(preferred) ? preferred : preferred === 'ur' ? 'ar' : available.includes('en') ? 'en' : 'ar')
    }
    window.addEventListener(APP_EVENTS.appLanguageChange, update)
    return () => window.removeEventListener(APP_EVENTS.appLanguageChange, update)
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
    setCurrentReadingPosition(1)
    window.scrollTo(0, 0)
    setChapterLoading(true)
    setChapter(null)
    hadithRepository.getChapter(collectionId, chapterIndex.file)
      .then((value) => {
        if (!active) return
        setChapter(value)
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
      if (record) setCurrentReadingPosition(chapter.records.findIndex((candidate) => candidate.id === record.id) + 1)
      void db.progress.put({ collectionId, chapterId, hadithId: visible.target.id, updatedAt: Date.now() })
    }, { threshold: [0.55, 0.8] })
    targets.forEach((target) => observer.observe(target))
    const hashTarget = window.location.hash ? document.getElementById(decodeURIComponent(window.location.hash.slice(1))) : null
    hashTarget?.scrollIntoView({ block: 'start' })
    return () => observer.disconnect()
  }, [chapter, chapterId, collectionId, visibleRecords])

  const renderHadith = (hadith: HadithRecord, index: number) => (
    <HadithCard
      key={hadith.id}
      hadith={hadith}
      translation={translation?.translations[hadith.id]}
      translationMetadata={translation?.metadata}
      showDiacritics={showDiacritics}
      arabicSize={arabicSize}
      collectionId={collectionId}
      chapterId={chapterId}
      displayNumber={hadith.chapterNumber || String(index + 1)}
      language={translation?.translations[hadith.id]?.language ?? language}
    />
  )

  return (
    <main className="reader-page page-with-nav two-pane-page">
      <aside className="browse-pane" aria-label={t('Browse chapters')}>
        <Link className="back-link" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> {t('Collection')}</Link>
        <p className="pane-label">{t('Chapters')}</p>
        <nav>
          {collection?.chapters.map((item) => (
            <Link data-active={item.id === chapterId} key={item.id} to={`/collection/${collectionId}/chapter/${item.id}`}>
              <span>{item.id.padStart(2, '0')}</span>{getChapterTitle(item, appLanguage)}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="read-pane">
        <div className="reader-heading">
          <div className="reader-crumbs"><Link className="back-link mobile-reader-back" to={`/collection/${collectionId}`}><ArrowLeft size={17} /> {t('All chapters')}</Link><Link className="reader-search-link" to="/search"><Search size={17} /> {t('Search')}</Link></div>
          <div>
            <p className="eyebrow">{t('Riyad as-Salihin / Chapter')} {chapterId}</p>
            <h1 dir="auto">{chapterIndex ? getChapterTitle(chapterIndex, appLanguage) : collectionLoading ? t('Opening the collection…') : t('Chapter unavailable')}</h1>
            <span className="reader-chapter-count">{chapterIndex?.count ?? 0} {t('hadith')} · {t(appLanguage === 'ur' ? 'Arabic text only' : 'Arabic with English translation')}</span>
            {chapterIndex && <div className="chapter-progress">
              <div><span>{t('Reading progress')}</span><span>{Math.min(currentReadingPosition, chapterIndex.count)} / {chapterIndex.count}</span></div>
              <progress max={chapterIndex.count} value={Math.min(currentReadingPosition, chapterIndex.count)} aria-label={`${t('Reading progress')}: ${Math.min(currentReadingPosition, chapterIndex.count)} ${t('of')} ${chapterIndex.count}`} />
            </div>}
          </div>
        </div>

        {appLanguage === 'ur' && <p className="notice" lang="ur" dir="rtl">{t('The Urdu translation for this collection is not available yet. The Arabic source text is shown.')}</p>}

        <div className="reader-toolbar" aria-label={t('Reader controls')}>
          <div className="reader-toolbar-head"><button className="open-reading-controls" aria-label={t('Open reading display settings')} onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}><Type size={17} /> {t('Display')}</button></div>
          {hasGrades && <label className="trust-control">
            <span>{t('Grade filter')}</span>
            <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value as TrustFilter)}>
              <option value="sahih">{t('Sahih only')}</option>
              <option value="sahih-hasan">{t('Sahih and Hasan')}</option>
              <option value="all">{t('All')}</option>
            </select>
          </label>}
        </div>

        {error && <p className="notice error" role="alert">{error}</p>}
        {chapterLoading && <div className="reader-loading" role="status"><span className="loading-dot" /> {t('Preparing this chapter…')}</div>}
        {visibleRecords.length === 0 && chapter && (
          <p className="empty-state">{t('No records match this trust filter. Missing grades are never inferred.')}</p>
        )}
        <section className="hadith-list" aria-live="polite">
          {visibleRecords.map(renderHadith)}
        </section>
        {chapterIndex && <nav className="chapter-navigation" aria-label={t('Chapter navigation')}>
          {previousChapter
            ? <Link to={`/collection/${collectionId}/chapter/${previousChapter.id}`}><ChevronLeft aria-hidden="true" /><span><small>{t('Previous chapter')}</small><strong dir="auto">{getChapterTitle(previousChapter, appLanguage)}</strong></span></Link>
            : <span aria-hidden="true" />}
          <span className="chapter-position">{t('Chapter')} {chapterOrdinal + 1} {t('of')} {collection?.chapters.length ?? 0}</span>
          {nextChapter
            ? <Link className="next-chapter" to={`/collection/${collectionId}/chapter/${nextChapter.id}`}><span><small>{t('Next chapter')}</small><strong dir="auto">{getChapterTitle(nextChapter, appLanguage)}</strong></span><ChevronRight aria-hidden="true" /></Link>
            : <span aria-hidden="true" />}
        </nav>}
      </section>

    </main>
  )
}
