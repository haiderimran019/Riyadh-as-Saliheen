import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, BookOpen, ChevronLeft, ChevronRight, Languages, MoreHorizontal, Search } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBootData, type QuranIndex, type QuranSura } from '../ssr/BootData'
import { useI18n } from '../i18n'
import { quranIndex, quranSurah } from '../services/reading'
import { ayahAtReadingLine } from '../services/readingPlace'
import { useQuranSettings } from '../services/QuranSettings'
import { quranEditions } from '../../shared/quran-editions.mjs'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { db } from '../data/db'
import { ResumeReading } from '../components/ResumeReading'
import { useShowDiacritics } from '../hooks/useShowDiacritics'
import { stripArabicDiacritics } from '../utils/arabicText'
import { QURAN_PAGE_SIZE, quranPage } from '../../shared/reading-pages.mjs'

export function QuranPage() {
  const boot = useBootData()
  const { t } = useI18n()
  const { surah } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [index, setIndex] = useState<QuranIndex | null>(boot.quranIndex || null)
  const [dataset, setDataset] = useState<QuranSura | null>(boot.quranSurah || null)
  const [query, setQuery] = useState('')
  const [scriptReady,setScriptReady]=useState(true),[fontError,setFontError]=useState('')
  const {preferences,update}=useQuranSettings()
  const english=preferences.showTranslation
  const edition=quranEditions.find(x=>x.key===preferences.edition) || quranEditions[0]
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [loading, setLoading] = useState(!boot.quranSurah)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const ayahsRef = useRef<HTMLElement>(null)
  const showDiacritics = useShowDiacritics()
  const id = Number(surah)
  const chapter = index?.chapters.find(x => x.id === id)
  const current = dataset?.result[0]?.sura === String(id) && dataset.metadata.edition.key===preferences.edition && (dataset.script?'indopak':'uthmani')===preferences.script ? dataset : null
  const { requested, start, end } = quranPage(params.get('ayah'), chapter?.count || current?.result.length || 286)

  useEffect(() => {
    let active = true
    void quranIndex().then(x => { if (active) setIndex(x) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [retry])

  useEffect(()=>{let active=true;setFontError('');if(preferences.script!=='indopak'){setScriptReady(true);return}setScriptReady(false);if(!document.fonts){setFontError(t('This browser cannot load the matching IndoPak font. Choose Uthmani.'));return}void document.fonts.load('32px "Riyad IndoPak"').then(fonts=>{if(!fonts.length)throw new Error('font');if(active)setScriptReady(true)}).catch(()=>{if(active)setFontError(t('The matching IndoPak font could not load. Try again or choose Uthmani.'))});return()=>{active=false}},[preferences.script,retry])

  useEffect(() => {
    setError(''); setSaveMessage('')
    if (!surah) { setLoading(false); return }
    let active = true
    if (boot.pathname !== `/quran/${surah}` || retry || preferences.edition!=='english_saheeh' || preferences.script!=='uthmani') { setDataset(null); setLoading(true) }
    void quranSurah(Number(surah),preferences.edition,preferences.script).then(x => { if (active) setDataset(x) })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    void db.quranBookmarks.where('surah').equals(Number(surah)).toArray()
      .then(items => { if (active) setSaved(new Set(items.map(x => x.id))) }).catch(() => undefined)
    return () => { active = false }
  }, [surah, retry, boot.pathname, preferences.edition, preferences.script])

  useEffect(() => {
    if (!current||!scriptReady) return
    document.getElementById(`ayah-${requested}`)?.scrollIntoView({ block: 'start', behavior: 'instant' })
    let last = requested
    let frame = 0
    const remember = (ayah: number) => {
      void db.quranProgress.put({ id: 'quran', surah: id, ayah, updatedAt: Date.now() }).catch(() => undefined)
    }
    remember(requested)
    const update = () => {
      frame = 0
      const items = [...(ayahsRef.current?.querySelectorAll<HTMLElement>('[data-ayah]') || [])]
        .map(element => ({ ayah: Number(element.dataset.ayah), top: element.getBoundingClientRect().top }))
      const ayah = ayahAtReadingLine(items, Math.min(180, window.innerHeight * 0.3))
      if (ayah && ayah !== last) { last = ayah; remember(ayah) }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [current, requested, id, scriptReady])

  const jump = (ayah: number) => setParams({ ayah: String(ayah) })
  const toggleBookmark = async (ayah: number) => {
    const key = `${id}:${ayah}`
    setSaving(key); setSaveMessage('')
    try {
      if (saved.has(key)) await db.quranBookmarks.delete(key)
      else await db.quranBookmarks.put({ id: key, surah: id, ayah, createdAt: Date.now() })
      setSaved(previous => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next })
      setSaveMessage(t(saved.has(key) ? 'Bookmark removed.' : 'Ayah saved. Open it directly from Saved passages.'))
    } catch { setSaveMessage(t('Could not save on this device. Please try again.')) }
    finally { setSaving(null) }
  }
  const visible = index?.chapters.filter(x => `${x.id} ${x.name} ${x.arabic} ${x.meaning}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) || []

  return <main className="feature-page quran-page">
    {!surah ? <>
      <header className="feature-heading"><div><h1>{t('The Quran')}</h1><p>{t('Read the Arabic. Explore the meaning. Return at your own pace.')}</p></div><span className="feature-heading-script" lang="ar" dir="rtl">القرآن الكريم</span></header>
      <ResumeReading only="quran" />
      <div className="quran-introduction"><BookOpen size={24} strokeWidth={1.3}/><div><strong>{t('The Noble Quran')}</strong><p>{index ? `114 ${t('surahs')} · ${index.ayahCount.toLocaleString()} ${t('ayahs')} · ${t('6 translation editions')}` : t('Opening the Quran…')}</p></div><span><Languages size={17}/>{t('Arabic · English · Urdu · Bengali')}</span></div>
      <label className="chapter-search quran-search"><Search size={19}/><span className="sr-only">{t('Find a surah')}</span><input type="search" placeholder={t('Search by surah name, meaning or number')} value={query} onChange={e => setQuery(e.target.value)}/></label>
      <div className="surah-catalogue">{visible.map(x => <Link className="surah-row" key={x.id} to={`/quran/${x.id}`}><span className="chapter-index">{String(x.id).padStart(2, '0')}</span><span><strong>{x.name}</strong><small>{x.meaning} · {x.count} {t('ayahs')}</small></span><span className="surah-arabic" lang="ar" dir="rtl">{x.arabic}</span><ArrowUpRight size={16}/></Link>)}</div>
      {index && !visible.length && <p className="empty-state">{t('No surahs found. Try a name or number.')}</p>}
    </> : <>
      <Link className="back-link" to="/quran"><ArrowLeft size={16}/>{t('All surahs')}</Link>
      <header className="feature-heading quran-reader-heading"><div><h1>{chapter?.name || `${t('Surah')} ${surah}`}</h1><p>{chapter?.meaning} {chapter ? `· ${chapter.count} ${t('ayahs')}` : ''}</p></div><span className="feature-heading-script" lang="ar" dir="rtl">{chapter?.arabic}</span></header>
      <div className="quran-reader-toolbar">
        <label><span>{t('Surah')}</span><select aria-label={t('Choose a surah')} value={id} onChange={e => navigate(`/quran/${e.target.value}`)}>{index?.chapters.map(x => <option key={x.id} value={x.id}>{x.id}. {x.name}</option>)}</select></label>
        <label><span>{t('Ayah')}</span><select aria-label={t('Jump to ayah')} value={Math.min(requested, chapter?.count || 1)} onChange={e => jump(Number(e.target.value))}>{Array.from({ length: chapter?.count || 1 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
        <button aria-pressed={english} data-track="quran.translation" onClick={() => update({showTranslation:!english})}><Languages size={17}/>{t('Translation')}<span className="translation-toggle-mark">{t(english ? 'On' : 'Off')}</span></button>
        <button className="quran-more" aria-label={t('Quran reading settings')} onClick={()=>dispatchAppEvent(APP_EVENTS.openReadingSettings)}><MoreHorizontal size={19}/>{t('More')}</button>
      </div>
      <p className="reading-place-note">{t('Your reading place is saved automatically on this device.')} <Link to="/saved">{t('Saved passages')}<ArrowUpRight size={13}/></Link></p>
      <p className="bookmark-message" role="status">{saveMessage}</p>
      {(loading||!scriptReady) && <div className="feature-loading" role="status">{t('Opening this surah…')}</div>}
      {current && scriptReady && <>
        <p className="quran-edition">{current.metadata.edition.title} · {t('Version')} {current.metadata.edition.version} · {current.metadata.publisher}</p>{current.script&&<p className="feature-footnote">{current.script.credit}</p>}
        <section ref={ayahsRef} className={`quran-ayahs script-${preferences.script} view-${preferences.mode}`} aria-label={t('Quran reading')}>
          {current.result.slice(start, end).map(ayah => {
            const key = `${id}:${ayah.aya}`, isSaved = saved.has(key)
            return <article className="quran-ayah" id={`ayah-${ayah.aya}`} data-ayah={ayah.aya} key={ayah.id}>
              <header><Link to={`?ayah=${ayah.aya}#ayah-${ayah.aya}`}>{ayah.sura}:{ayah.aya}</Link><span>{t('Ayah')} {ayah.aya}</span><button className="ayah-bookmark" data-track="quran.bookmark" disabled={saving === key} aria-label={`${t(isSaved ? 'Remove saved ayah' : 'Save ayah')} ${key}`} aria-pressed={isSaved} onClick={() => void toggleBookmark(Number(ayah.aya))}><Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'}/><span>{t(isSaved ? 'Saved' : 'Save')}</span></button></header>
              <p className="quran-arabic" lang="ar" dir="rtl">{showDiacritics ? ayah.arabic_text : stripArabicDiacritics(ayah.arabic_text)}</p>
              {english && <section className="quran-translation" lang={edition.language} dir={edition.language==='ur'?'rtl':'ltr'}><p>{ayah.translation}</p>{ayah.footnotes && <details><summary>{t('Translation notes')}</summary><p>{ayah.footnotes}</p></details>}</section>}
            </article>
          })}
        </section>
        <nav data-track="quran.page" className="quran-pagination" aria-label={t('Quran pagination')}><button disabled={start === 0} data-track="quran.page" onClick={() => jump(Math.max(1, start - QURAN_PAGE_SIZE + 1))}><ChevronLeft size={18}/>{t('Previous')}</button><span>{start + 1}–{end} / {current.result.length}</span><button disabled={end >= current.result.length} data-track="quran.page" onClick={() => jump(end + 1)}>{t('Next')}<ChevronRight size={18}/></button></nav>
        <noscript><nav>{start > 0 && <a href={`?ayah=${Math.max(1, start - QURAN_PAGE_SIZE + 1)}`}>{t('Previous')} </a>}{end < current.result.length && <a href={`?ayah=${end + 1}`}>{t('Next')}</a>}</nav></noscript>
        <div className="quran-surah-navigation">{id > 1 && <Link to={`/quran/${id - 1}`}><ArrowLeft size={16}/>{t('Previous surah')}</Link>}{id < 114 && <Link to={`/quran/${id + 1}`}>{t('Next surah')}<ArrowRight size={16}/></Link>}</div>
      </>}
    </>}
    {(error||fontError) && <div className="notice error" role="alert"><p>{t(error||fontError)}</p><button onClick={() => setRetry(x => x + 1)}>{t('Try again')}</button></div>}
    <p className="feature-footnote">{t('Arabic text, translations and notes:')} <a href={current?.metadata.sourceUrl || index?.sourceUrl || 'https://quranenc.com/en/home/api/'} target="_blank" rel="noreferrer">{current?.metadata.publisher||'QuranEnc.com'}</a>. {t('Source wording is preserved. Translations explain the meaning of the Quran.')}</p>
  </main>
}
