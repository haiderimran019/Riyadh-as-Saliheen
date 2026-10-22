import { useEffect, useState } from 'react'
import { useBootData } from '../ssr/BootData'
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Flower2, Heart, MessageCircle, RotateCcw, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION } from '../config'
import { db, type ReadingProgress } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import { loadDailyQuran, loadTranslation } from '../data/loader'
import type { CollectionIndex, DailyQuranDataset, TranslationChapterDataset } from '../types/hadith'
import { selectDailyAyah } from '../utils/dailyHadith'
import { useI18n } from '../i18n'
import { stripArabicDiacritics } from '../utils/arabicText'
import { useShowDiacritics } from '../hooks/useShowDiacritics'
import { getChapterTitle } from '../utils/chapterTitle'

const everydayThemes = [
  { chapterId: '1', title: 'Begin with intention', Icon: Compass },
  { chapterId: '2', title: 'Make room to return', Icon: RotateCcw },
  { chapterId: '3', title: 'Meet hardship with patience', Icon: Sprout },
  { chapterId: '74', title: 'Choose gentleness', Icon: Heart },
  { chapterId: '88', title: 'Speak with care', Icon: MessageCircle },
  { chapterId: '97', title: 'Seek guidance', Icon: Compass },
]

function withIsolatedFootnoteMarkers(text: string, language: string) {
  if (language !== 'ur') return text
  return text.split(/(\[\d+\][.،؟]?)/gu).map((part, index) =>
    /^\[\d+\]/u.test(part) ? <bdi key={index} dir="ltr">{part}</bdi> : part,
  )
}

export function HomePage() {
  const boot=useBootData()
  const [dailyMoment, setDailyMoment] = useState(() => new Date(boot.now || Date.now()))
  const [collection, setCollection] = useState<CollectionIndex | null>(boot.collection || null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [dailyHadith, setDailyHadith] = useState<Awaited<ReturnType<typeof hadithRepository.getDailyHadith>> | null>(boot.dailyHadith || null)
  const [dailyTranslationSelection, setDailyTranslationSelection] = useState<{ language: string; hadithId: string; dataset: TranslationChapterDataset } | null>(boot.dailyHadith&&boot.dailyTranslation?{language:'en',hadithId:boot.dailyHadith.id,dataset:boot.dailyTranslation}:null)
  const [quran, setQuran] = useState<DailyQuranDataset | null>(boot.dailyQuran || null)
  const showDiacritics = useShowDiacritics()
  const { language, t } = useI18n()
  const dailyTranslation = dailyTranslationSelection?.language === language && dailyTranslationSelection.hadithId === dailyHadith?.id ? dailyTranslationSelection.dataset : null
  const translatedDailyHadith = dailyHadith ? dailyTranslation?.translations[dailyHadith.id] : undefined
  const isMatchedDailyUrdu = language === 'ur' && Boolean(translatedDailyHadith?.raw)

  useEffect(() => {
    const refresh = () => setDailyMoment(new Date())
    const untilNextWindow = 6 * 60 * 60 * 1000 - (Date.now() % (6 * 60 * 60 * 1000)) + 100
    const timer = window.setTimeout(refresh, untilNextWindow)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [dailyMoment])

  useEffect(() => {
    if (DATA_MODE !== 'real') return
    let active = true
    setDailyTranslationSelection(null)
    void hadithRepository.getCollection(DEFAULT_COLLECTION).then(async (value) => {
      if (!active) return
      setCollection(value)
      const record = await hadithRepository.getDailyHadith(dailyMoment)
      if (!active) return
      setDailyHadith(record ?? null)
      if (record && value.languages.includes(language)) {
        const chapter = value.chapters.find((item) => item.id === record.chapterId)
        if (chapter) {
          const dataset = await loadTranslation(language, DEFAULT_COLLECTION, chapter.file).catch(() => null)
          if (active && dataset) setDailyTranslationSelection({ language, hadithId: record.id, dataset })
        }
      }
    }).catch(() => undefined)
    void db.progress.get(DEFAULT_COLLECTION).then((value) => { if (active) setProgress(value ?? null) })
    void loadDailyQuran().then((value) => { if (active) setQuran(value) }).catch(() => undefined)
    return () => { active = false }
  }, [dailyMoment, language])

  const firstChapter = collection?.chapters[0]
  const numberLocale = language === 'ur' ? 'ur-PK' : 'en-US'
  const readUrl = progress
    ? `/collection/${DEFAULT_COLLECTION}/chapter/${progress.chapterId}#${progress.hadithId}`
    : firstChapter ? `/collection/${DEFAULT_COLLECTION}/chapter/${firstChapter.id}` : '/library'

  const ayah = quran?.ayahs.length ? selectDailyAyah(quran, dailyMoment) : null
  const nextChapter = collection?.chapters.find((chapter) => chapter.id === progress?.chapterId)
  return <main className="today-page">
    <header className="today-heading"><div><h1>{t('A moment for meaning.')}</h1><p>{t('Come as you are. Leave with something to reflect on.')}</p></div><time dateTime={dailyMoment.toISOString()}>{new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone:'UTC' }).format(dailyMoment)}</time></header>
    <section className="reading-invitation" aria-label={t('Explore Riyad as-Salihin')}>
      <div className="invitation-copy"><span className="invitation-author">{t('Imam al-Nawawi’s Riyad as-Salihin')}</span><h2>{t('Timeless wisdom.')}<br /><em>{t('For everyday life.')}</em></h2><p>{t('The gardens of the righteous. A collection to read, reflect on, and return to — one hadith at a time.')}</p><Link className="primary-action" to={readUrl}>{t(progress ? 'Continue reading' : 'Begin your reading')}<ArrowRight size={18} /></Link><span className="edition-line">{collection ? `${collection.chapters.length.toLocaleString(numberLocale)} ${t('Chapters')} · ${(collection.recordIds?.length ?? 0).toLocaleString(numberLocale)} ${t('hadith')}` : t('Loading the collection…')}<span>·</span>{t('Arabic · English · Urdu')}</span></div>
      <div className="invitation-art"><img src={`${import.meta.env.BASE_URL}images/reading-garden.png`} alt="" fetchPriority="high" /><span className="art-caption" lang="ar" dir="rtl">رياض الصالحين</span></div>
    </section>
    <div className="daily-desk">
      <section className="daily-hadith daily-paper" aria-labelledby="daily-hadith-title"><header className="section-line"><h2 id="daily-hadith-title">{t('A hadith for today')}</h2><span><span className="live-dot" />{t('Daily reading')}</span></header>
        {dailyHadith ? <><p className="daily-arabic" lang="ar" dir="rtl">{showDiacritics ? dailyHadith.arabic : stripArabicDiacritics(dailyHadith.arabic)}</p>{translatedDailyHadith ? <p className="daily-translation" lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{translatedDailyHadith.text}</p> : <p className="daily-missing-translation">{t(language === 'ur' ? 'Urdu translation is not available for this narration; the Arabic text above is from the source edition.' : 'English translation is not available for this narration; the Arabic text above is from the source edition.')}</p>}
        {isMatchedDailyUrdu && <small className="matching-note">{t('Urdu · matching narration')} · {t('This Urdu text translates HadeethEnc’s matching narration; additional wording in the Riyad edition may differ.')}</small>}
        <footer className="daily-paper-foot"><div><span>{t('Riyad as-Salihin')} · {t('Hadith')} {dailyHadith.number}</span><small className="daily-source-line">{dailyTranslation?.metadata.sourceName ?? dailyHadith.sourceName ?? 'IslamHouse / IslamEnc'}{dailyTranslation?.metadata.version ? ` · ${dailyTranslation.metadata.version}` : ''}</small></div><Link className="circle-link" to={`/collection/${DEFAULT_COLLECTION}/chapter/${dailyHadith.chapterId}#${dailyHadith.id}`} aria-label={t('Read hadith')}><ArrowUpRight size={21} /></Link></footer></> : <p className="loading-copy">{t('Opening today’s reading…')}</p>}
      </section>
      <aside className="reading-margin"><section className="return-reading"><BookOpen size={23} strokeWidth={1.5} /><h2>{t(progress ? 'Pick up where you paused.' : 'Every journey begins with intention.')}</h2><p>{nextChapter ? getChapterTitle(nextChapter, language) : t('Open the first chapter and take your time. Your place is saved as you read.')}</p><Link className="text-action" to={readUrl}>{t(progress ? 'Continue reading' : 'Start with chapter one')}<ArrowRight size={17} /></Link>{progress && <small>{t('Chapter')} {progress.chapterId} · {t('Hadith')} {progress.hadithId.split('-').at(-1)}</small>}</section>
      {ayah && quran && <section className="daily-ayah"><header className="section-line"><h2>{t('An ayah to reflect on')}</h2></header><p className="daily-arabic" dir="rtl" lang="ar">{ayah.arabic_text}</p><p className="daily-translation" lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{withIsolatedFootnoteMarkers(ayah.translations[language].translation, language)}</p>{ayah.translations[language].footnotes && <details className="daily-footnotes"><summary>{t('Translation notes')}</summary><p lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{withIsolatedFootnoteMarkers(ayah.translations[language].footnotes, language)}</p></details>}<footer><span>{t('Qur’an')} {ayah.sura}:{ayah.aya}</span><small>QuranEnc.com · {quran.translations[language].title} · v{quran.translations[language].version}</small></footer></section>}
      </aside>
    </div>
    <section className="paths-section" aria-labelledby="paths-title"><header className="section-line"><div><h2 id="paths-title">{t('What’s on your mind?')}</h2><p>{t('Find a chapter that speaks to your day.')}</p></div><Link className="text-action" to="/library">{t('All chapters')}<ArrowRight size={17} /></Link></header><div className="reading-paths">{everydayThemes.map(({ chapterId, title, Icon }) => { const chapter = collection?.chapters.find((item) => item.id === chapterId); return chapter && <Link className="reading-path" key={chapterId} to={`/collection/${DEFAULT_COLLECTION}/chapter/${chapter.id}`}><Icon size={24} strokeWidth={1.3} /><span><strong>{t(title)}</strong><small>{t('Chapter')} {chapter.id} · {chapter.count} {t('hadith')}</small></span><ArrowUpRight size={17} /></Link> })}</div></section>
    <div className="home-colophon"><Flower2 size={18} strokeWidth={1.2} /><span>{t('A little time. A little reflection. An everyday companion.')}</span><Link to="/sources">{t('Explore the sources')}<ArrowUpRight size={14} /></Link></div>
  </main>
}
