import { useEffect, useMemo, useState } from 'react'
import { useBootData } from '../ssr/BootData'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, LayoutGrid, List, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { hadithRepository } from '../data/HadithRepository'
import { db, type ReadingProgress } from '../data/db'
import { DEFAULT_COLLECTION } from '../config'
import type { CollectionIndex } from '../types/hadith'
import { useI18n } from '../i18n'
import { getChapterTitle } from '../utils/chapterTitle'

export function CollectionPage() { const { collectionId = DEFAULT_COLLECTION } = useParams(); return <ChapterCatalogue collectionId={collectionId} /> }
export function ChapterCatalogue({ collectionId = DEFAULT_COLLECTION }: { collectionId?: string }) {
  const { t, language } = useI18n()
  const boot=useBootData()
  const [collection, setCollection] = useState<CollectionIndex | null>(boot.collection || null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [query, setQuery] = useState('')
  const [shortOnly, setShortOnly] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [limit, setLimit] = useState(24)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true; setError('')
    hadithRepository.getCollection(collectionId).then((value) => { if (active) setCollection(value) }).catch(() => { if (active) setError('The collection could not be loaded. Please try again.') })
    void db.progress.get(collectionId).then((value) => { if (active) setProgress(value ?? null) })
    return () => { active = false }
  }, [collectionId, retry])
  const visible = useMemo(() => collection?.chapters.filter((chapter) => (!shortOnly || chapter.count <= 5) && `${chapter.id} ${chapter.title} ${chapter.titleArabic ?? ''} ${getChapterTitle(chapter, language)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ?? [], [collection, query, shortOnly, language])
  return <main className="catalogue-page">
    <header className="catalogue-heading"><div><h1>{t('The collection')}</h1><p>{t('A lifetime of wisdom. A chapter for every day.')}</p></div><span className="catalogue-arabic" lang="ar" dir="rtl">رياض الصالحين</span></header>
    <div className="collection-context"><BookOpen size={22} strokeWidth={1.4} /><div><strong>{t('Riyad as-Salihin')}</strong><span>{t('Compiled by Imam al-Nawawi')} · {collection?.chapters.length ?? '—'} {t('Chapters')} · {collection?.recordIds?.length.toLocaleString() ?? '—'} {t('hadith')}</span></div><Link to={`/collection/${collectionId}/chapter/${progress?.chapterId ?? '1'}${progress ? `#${progress.hadithId}` : ''}`} className="text-action">{t(progress ? 'Continue reading' : 'Begin reading')}<ArrowRight size={17} /></Link></div>
    <div className="catalogue-tools"><label className="chapter-search"><Search size={19} /><span className="sr-only">{t('Find a chapter')}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(24) }} placeholder={t('Find a chapter by title or number')} /></label><div className="view-switch" role="group" aria-label={t('Catalogue layout')}><button aria-label={t('Grid view')} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={18} /></button><button aria-label={t('List view')} aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={20} /></button></div></div>
    <div className="catalogue-filterbar"><div className="filter-tabs"><button aria-pressed={!shortOnly} onClick={() => { setShortOnly(false); setLimit(24) }}>{t('All chapters')}</button><button aria-pressed={shortOnly} onClick={() => { setShortOnly(true); setLimit(24) }}>{t('Short reads')}<span>≤ 5</span></button></div><span>{visible.length} {t('Chapters')}<ArrowDown size={13} />{t('Original order')}</span></div>
    {error && <div className="notice error" role="alert">{t(error)}<button onClick={() => setRetry((value) => value + 1)}>{t('Try again')}</button></div>}
    {!collection && !error && <div className="catalogue-loading" role="status">{t('Opening the collection…')}</div>}
    {collection && visible.length === 0 && <div className="empty-state"><Search size={32} strokeWidth={1.3} /><h2>{t('No chapters found')}</h2><p>{t('Try another title or chapter number.')}</p><button onClick={() => { setQuery(''); setShortOnly(false) }}>{t('Clear filters')}</button></div>}
    <div className={`chapter-catalogue ${view === 'list' ? 'is-list' : ''}`}>{visible.slice(0, limit).map((chapter) => <Link className="chapter-row" key={chapter.id} to={`/collection/${collectionId}/chapter/${chapter.id}`}><span className="chapter-index">{chapter.id.padStart(2, '0')}</span><span className="chapter-row-copy"><strong dir="auto">{getChapterTitle(chapter, language)}</strong>{chapter.titleArabic && language !== 'ur' && <span className="chapter-arabic" lang="ar" dir="rtl">{chapter.titleArabic.replace(/^\d+\s*[-–—]\s*/, '')}</span>}<small>{chapter.count} {t('hadith')}{progress?.chapterId === chapter.id && <b>{t('Last read')}</b>}</small></span><ArrowUpRight size={17} /></Link>)}</div>
    {limit < visible.length && <div className="catalogue-more"><span>{t('Showing')} {Math.min(limit, visible.length)} {t('of')} {visible.length}</span><button onClick={() => setLimit((value) => value + 24)}>{t('More chapters')}<ArrowDown size={16} /></button></div>}
    <noscript><nav aria-label="All chapters without JavaScript">{collection?.chapters.map(x=><Link key={x.id} to={`/collection/${collectionId}/chapter/${x.id}`}>{x.id}. {x.title} </Link>)}</nav></noscript><p className="catalogue-source">{t('Hadith: IslamHouse / IslamEnc. Urdu matching narrations: HadeethEnc, partial coverage. Quran meanings: QuranEnc and Tanzil. IndoPak text: Quran Foundation / QuranWBW.')} <Link to="/sources">{t('Sources & credits')}<ArrowUpRight size={13} /></Link></p>
  </main>
}
