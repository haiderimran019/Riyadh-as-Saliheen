import { useEffect, useMemo, useState } from 'react'
import { useBootData } from '../ssr/BootData'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Columns2, List, Maximize2, Minimize2, Search, Type } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { HadithCard } from '../components/HadithCard'
import type { ReadingPreferences } from '../components/ReadingControlsSheet'
import { db, getSetting } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import type { ArabicChapterDataset, CollectionIndex, TranslationChapterDataset } from '../types/hadith'
import { useI18n } from '../i18n'
import { getChapterTitle } from '../utils/chapterTitle'

export function ReaderPage() {
  const { language, t } = useI18n()
  const boot=useBootData()
  const { collectionId = '', chapterId = '' } = useParams()
  const location = useLocation(), navigate = useNavigate()
  const [collection, setCollection] = useState<CollectionIndex | null>(boot.collection || null)
  const [chapter, setChapter] = useState<ArabicChapterDataset | null>(boot.chapter || null)
  const [translation, setTranslation] = useState<TranslationChapterDataset | null>(boot.translation || null)
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(32)
  const [activeIndex, setActiveIndex] = useState(()=>Math.max(0,boot.chapter?.records.findIndex(x=>x.id===boot.hadithId)??0))
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [chapterQuery, setChapterQuery] = useState('')
  const [layout, setLayout] = useState<'parallel' | 'arabic' | 'translation'>('parallel')
  const [focus, setFocus] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!boot.chapter)
  const [retry, setRetry] = useState(0)
  const chapterIndex = useMemo(() => collection?.chapters.find((item) => item.id === chapterId), [collection, chapterId])
  const ordinal = collection?.chapters.findIndex((item) => item.id === chapterId) ?? -1
  const previousChapter = collection?.chapters[ordinal - 1], nextChapter = collection?.chapters[ordinal + 1]
  const record = chapter?.records[activeIndex]
  useEffect(() => {
    let active = true
    void hadithRepository.getCollection(collectionId).then((value) => { if (active) setCollection(value) }).catch(() => { if (active) { setError('The collection could not be loaded. Please try again.'); setLoading(false) } })
    void Promise.all([getSetting('showDiacritics', true), getSetting('arabicSizePx', window.innerWidth < 721 ? 28 : 32)]).then(([diacritics, size]) => { if (active) { setShowDiacritics(diacritics); setArabicSize(size) } })
    return () => { active = false }
  }, [collectionId, retry])
  useEffect(() => {
    if (!collection) return
    if (!chapterIndex) { setLoading(false); setError('This chapter could not be found. Choose another chapter from the collection.'); return }
    let active = true
    setError(''); if(boot.chapterId!==chapterId||retry){setLoading(true);setChapter(null);setActiveIndex(0)} setChaptersOpen(false)
    void hadithRepository.getChapter(collectionId, chapterIndex.file).then((value) => { if (active) setChapter(value) }).catch(() => { if (active) setError('This chapter could not be loaded. Check your connection and try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [collection, chapterIndex, collectionId, retry])
  useEffect(() => {
    let active = true; setTranslation(null)
    if (chapterIndex && collection?.languages.includes(language)) void hadithRepository.getTranslation(language, collectionId, chapterIndex.file).then((value) => { if (active) setTranslation({ ...value, translations: Object.fromEntries(Object.entries(value.translations).map(([id, item]) => [id, { ...item, language }])) }) }).catch(() => undefined)
    return () => { active = false }
  }, [chapterIndex, collectionId, collection, language])
  useEffect(() => {
    if (!chapter) return
    let targetId = ''
    try { targetId = decodeURIComponent(location.hash.slice(1)) || new URLSearchParams(location.search).get('hadith') || '' } catch { /* Invalid fragments open the first passage. */ }
    const index = chapter.records.findIndex((item) => item.id === targetId)
    setActiveIndex(index >= 0 ? index : 0)
  }, [chapter, location.hash, location.search])
  useEffect(() => {
    if (record && record.chapter === chapterId) void db.progress.put({ collectionId, chapterId, hadithId: record.id, updatedAt: Date.now() }).catch(() => undefined)
  }, [record, collectionId, chapterId])
  useEffect(() => {
    const update = (event: Event) => { const value = (event as CustomEvent<ReadingPreferences>).detail; setShowDiacritics(value.showDiacritics); setArabicSize(value.arabicSize) }
    window.addEventListener(APP_EVENTS.readingPreferencesChange, update)
    return () => window.removeEventListener(APP_EVENTS.readingPreferencesChange, update)
  }, [])
  useEffect(() => {
    document.body.classList.toggle('reader-focus', focus)
    return () => document.body.classList.remove('reader-focus')
  }, [focus])
  useEffect(() => { if (record && translation && !translation.translations[record.id] && layout === 'translation') setLayout('parallel') }, [record, translation, layout])
  const openPassage = (index: number) => {
    const target = chapter?.records[index]; if (!target) return
    navigate({ pathname: location.pathname, search:`?hadith=${encodeURIComponent(target.id)}`, hash: target.id }, { replace: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const filteredChapters = collection?.chapters.filter((item) => `${item.id} ${getChapterTitle(item, language)} ${item.titleArabic}`.toLocaleLowerCase().includes(chapterQuery.toLocaleLowerCase()))
  return <main className={`reading-room reader-page ${focus ? 'is-focused' : ''}`}>
    <div className="room-navigation"><Link className="back-link" to="/library"><ArrowLeft size={16} />{t('The collection')}</Link><span>{t('Riyad as-Salihin')}<ChevronRight size={14} />{t('Chapter')} {chapterId}</span><button className="icon-button" aria-label={t(focus ? 'Leave focus mode' : 'Enter focus mode')} aria-pressed={focus} onClick={() => setFocus((value) => !value)}>{focus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button></div>
    <header className="room-heading"><span className="chapter-seal">{chapterId.padStart(2, '0')}</span><div><h1 dir="auto">{chapterIndex ? getChapterTitle(chapterIndex, language) : t(loading ? 'Opening the collection…' : 'Chapter unavailable')}</h1>{chapterIndex?.titleArabic && <p lang="ar" dir="rtl">{chapterIndex.titleArabic.replace(/^\d+\s*[-–—]\s*/, '')}</p>}<span className="reader-chapter-count">{chapterIndex?.count ?? 0} {t('hadith')} · {t(language === 'ur' ? 'Arabic with available Urdu translations' : 'Arabic with English translation')}</span></div></header>
    <div className="room-toolbar"><button className="chapter-toggle" aria-expanded={chaptersOpen} onClick={() => setChaptersOpen((value) => !value)}><List size={17} />{t('Chapters')}<ChevronDown size={15} /></button><div className="reading-layout" role="group" aria-label={t('Reading layout')}><button aria-pressed={layout === 'parallel'} onClick={() => setLayout('parallel')}><Columns2 size={16} />{t('Together')}</button><button aria-pressed={layout === 'arabic'} onClick={() => setLayout('arabic')}>{t('Arabic')}</button><button disabled={!record || !translation?.translations[record.id]} aria-pressed={layout === 'translation'} onClick={() => setLayout('translation')}>{t('Translation')}</button></div><button className="reader-display" aria-label={t('Display')} onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}><Type size={18} /><span>{t('Display')}</span></button></div>
    {chaptersOpen && <section className="chapter-drawer" aria-label={t('Browse chapters')}><label className="chapter-search"><Search size={18} /><input aria-label={t('Find a chapter')} placeholder={t('Find a chapter by title or number')} type="search" value={chapterQuery} onChange={(event) => setChapterQuery(event.target.value)} /></label><nav>{filteredChapters?.map((item) => <Link key={item.id} aria-current={item.id === chapterId ? 'page' : undefined} to={`/collection/${collectionId}/chapter/${item.id}`}><span>{item.id.padStart(2, '0')}</span>{getChapterTitle(item, language)}<ArrowRight size={14} /></Link>)}</nav></section>}
    <div className="chapter-progress"><div><span>{t('Your place in this chapter')}</span><span>{record ? activeIndex + 1 : 0} / {chapter?.records.length ?? 0}</span></div><progress max={chapter?.records.length || 1} value={record ? activeIndex + 1 : 0} aria-label={t('Reading progress')} /></div>
    {loading && <div className="reader-loading" role="status">{t('Preparing this chapter…')}</div>}
    {error && <div className="notice error" role="alert"><p>{t(error)}</p><button onClick={() => setRetry((value) => value + 1)}>{t('Try again')}</button><Link to="/library">{t('All chapters')}</Link></div>}
    {record && <>
    <p className="reading-place-note">{t('Your reading place is saved automatically on this device.')} <Link to="/saved">{t('Saved passages')}</Link></p>
    <nav className="passage-navigation" aria-label={t('Hadith navigation')}><button onClick={() => openPassage(activeIndex - 1)} disabled={activeIndex === 0}><ChevronLeft size={18} /><span>{t('Previous hadith')}</span></button><label><span className="sr-only">{t('Jump to hadith')}</span><select aria-label={t('Jump to hadith')} value={activeIndex} onChange={(event) => openPassage(Number(event.target.value))}>{chapter?.records.map((item, index) => <option key={item.id} value={index}>{t('Hadith')} {index + 1} / {chapter.records.length}</option>)}</select></label><button onClick={() => openPassage(activeIndex + 1)} disabled={activeIndex >= (chapter?.records.length ?? 0) - 1}><span>{t('Next hadith')}</span><ChevronRight size={18} /></button></nav><div className={`passage-stage layout-${layout}`}><HadithCard key={record.id} hadith={record} translation={translation?.translations[record.id]} translationMetadata={translation?.metadata} showDiacritics={showDiacritics} arabicSize={arabicSize} collectionId={collectionId} chapterId={chapterId} displayNumber={record.chapterNumber || String(activeIndex + 1)} language={language} /></div></>}
    <noscript><nav aria-label="Hadith links without JavaScript">{chapter?.records.map((x,i)=><Link key={x.id} to={`?hadith=${encodeURIComponent(x.id)}`}>Hadith {i+1} </Link>)}</nav></noscript>
    {chapterIndex && <nav className="chapter-navigation" aria-label={t('Chapter navigation')}>{previousChapter ? <Link to={`/collection/${collectionId}/chapter/${previousChapter.id}`}><ArrowLeft size={17} /><span><small>{t('Previous chapter')}</small><strong dir="auto">{getChapterTitle(previousChapter, language)}</strong></span></Link> : <span />}<span className="chapter-position">{ordinal + 1} / {collection?.chapters.length}</span>{nextChapter ? <Link className="next-chapter" to={`/collection/${collectionId}/chapter/${nextChapter.id}`}><span><small>{t('Next chapter')}</small><strong dir="auto">{getChapterTitle(nextChapter, language)}</strong></span><ArrowRight size={17} /></Link> : <span />}</nav>}
  </main>
}
