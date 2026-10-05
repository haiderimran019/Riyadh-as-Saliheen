import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION, SHOW_FEEDBACK } from '../config'
import { db, getSetting, type ReadingProgress } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import { loadDailyQuran, loadTranslation } from '../data/loader'
import type { CollectionIndex, DailyQuranDataset, TranslationChapterDataset } from '../types/hadith'
import { selectDailyAyah } from '../utils/dailyHadith'
import { useI18n } from '../i18n'
import { APP_EVENTS } from '../core/appEvents'
import { stripArabicDiacritics } from '../utils/arabicText'

export function HomePage() {
  const [dailyMoment, setDailyMoment] = useState(() => new Date())
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [dailyHadith, setDailyHadith] = useState<Awaited<ReturnType<typeof hadithRepository.getDailyHadith>> | null>(null)
  const [dailyTranslation, setDailyTranslation] = useState<TranslationChapterDataset | null>(null)
  const [quran, setQuran] = useState<DailyQuranDataset | null>(null)
  const [showDiacritics, setShowDiacritics] = useState(true)
  const { language, t } = useI18n()

  useEffect(() => {
    void getSetting('showDiacritics', true).then(setShowDiacritics)
    const update = (event: Event) => setShowDiacritics((event as CustomEvent<{ showDiacritics: boolean }>).detail.showDiacritics)
    window.addEventListener(APP_EVENTS.readingPreferencesChange, update)
    return () => window.removeEventListener(APP_EVENTS.readingPreferencesChange, update)
  }, [])

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
    void hadithRepository.getCollection(DEFAULT_COLLECTION).then(async (value) => {
      setCollection(value)
      const record = await hadithRepository.getDailyHadith(dailyMoment)
      setDailyHadith(record ?? null)
      if (record && language === 'en') {
        const chapter = value.chapters.find((item) => item.id === record.chapterId)
        if (chapter) setDailyTranslation(await loadTranslation('en', DEFAULT_COLLECTION, chapter.file).catch(() => null))
      }
    }).catch(() => undefined)
    void db.progress.get(DEFAULT_COLLECTION).then((value) => setProgress(value ?? null))
    void loadDailyQuran().then(setQuran).catch(() => undefined)
  }, [dailyMoment, language])

  const firstChapter = collection?.chapters[0]
  const readUrl = progress
    ? `/collection/${DEFAULT_COLLECTION}/chapter/${progress.chapterId}#${progress.hadithId}`
    : firstChapter ? `/collection/${DEFAULT_COLLECTION}/chapter/${firstChapter.id}` : '/library'

  return (
    <main className="welcome page-with-nav riyad-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-text">
          <p className="eyebrow">{t('THE GARDENS OF THE RIGHTEOUS')} <span aria-hidden="true">—</span> رياض الصالحين</p>
          <h1 id="home-title">{t('A place to return to the words.')}</h1>
          <p className="home-intro">{t('Read Riyad as-Salihin with the Arabic text and English translation, one chapter and one hadith at a time.')}</p>
          <div className="home-actions">
            <Link className="primary-action" to={readUrl}><BookOpen size={19} /> {t(progress ? 'Continue reading' : 'Start reading')} <ArrowRight size={18} /></Link>
            <Link className="home-secondary-action" to="/search"><Search size={19} /> {t('Search the collection')}</Link>
          </div>
          <p className="home-hero-count">{collection ? `${new Intl.NumberFormat('en-US').format(collection.chapters.length)} ${t('Chapters')} · ${new Intl.NumberFormat('en-US').format(collection.recordIds?.length ?? 0)} ${t('hadith')}` : t('Arabic and English')}</p>
        </div>
        <div className="home-hero-art" aria-hidden="true"><span className="garden-arch"><span>رياض<br />الصالحين</span></span></div>
      </section>

      <section className="home-explore" aria-label={t('Explore Riyad as-Salihin')}>
        <div className="section-title"><div><p className="eyebrow">{t('YOUR READING')}</p><h2>{t('Make room for reflection.')}</h2></div><Link to={`/collection/${DEFAULT_COLLECTION}`}>{t('All chapters')} <ArrowRight size={17} /></Link></div>
        <div className="home-link-grid">
          <Link className="home-link-card" to={readUrl}><span className="home-link-icon"><BookOpen size={22} /></span><span><strong>{progress ? t('Pick up where you left off') : t('Begin with Chapter 1')}</strong><small>{progress ? `${t('Chapter')} ${progress.chapterId} · ${t('Hadith')} ${progress.hadithId.split('-')[0]}` : firstChapter?.title.replace(/^\d+\s*[-–—]\s*/, '') ?? t('The collection opens with intention.')}</small></span><ArrowRight size={19} /></Link>
        </div>
      </section>
      {dailyHadith && <section className="daily-card daily-hadith" aria-labelledby="daily-hadith-title"><p className="eyebrow"><Sparkles size={14} /> {t('Hadith of the day')}</p><p className="daily-arabic" lang="ar" dir="rtl">{showDiacritics ? dailyHadith.arabic : stripArabicDiacritics(dailyHadith.arabic)}</p>{language === 'en' && dailyTranslation?.translations[dailyHadith.id] && <p className="daily-translation">{dailyTranslation.translations[dailyHadith.id].text}</p>}{language === 'en' && !dailyTranslation?.translations[dailyHadith.id] && <p className="daily-missing-translation">{t('English translation is not available for this narration; the Arabic text above is from the source edition.')}</p>}{language === 'ur' && <p className="daily-missing-translation" lang="ur">{t('The Urdu translation for this collection is not available yet. The Arabic source text is shown.')}</p>}<div className="daily-card-footer"><span id="daily-hadith-title">Riyad as-Salihin · {t('Hadith')} {dailyHadith.number} · IslamEnc.com</span><Link to={`/collection/${DEFAULT_COLLECTION}/chapter/${dailyHadith.chapterId}#${dailyHadith.id}`}>{t('Read hadith')} <ArrowRight size={16} /></Link></div></section>}
      {quran && quran.ayahs.length > 0 && (() => { const ayah = selectDailyAyah(quran, dailyMoment); const localized = ayah.translations[language]; return <section className="daily-card daily-ayah" aria-labelledby="daily-ayah-title"><p className="eyebrow"><Sparkles size={14} /> {t('Ayah of the day')}</p><p className="daily-arabic" lang="ar" dir="rtl">{ayah.arabic_text}</p><p className="daily-translation" lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{localized.translation}</p>{localized.footnotes && <details className="daily-footnotes"><summary>{t('Translation notes')}</summary><p lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{localized.footnotes}</p></details>}<div className="daily-card-footer"><span id="daily-ayah-title">{t('Qur’an')} · {ayah.sura}:{ayah.aya}</span><span>QuranEnc.com · {quran.translations[language].title} · v{quran.translations[language].version}</span></div></section> })()}
      <div className="home-bottomline"><span>{t('No account. No ads. No tracking.')}</span><span><Link to="/sources">{t('Text & sources')}</Link>{SHOW_FEEDBACK && <> · <Link to="/feedback">{t('Feedback')}</Link></>}</span></div>
    </main>
  )
}
