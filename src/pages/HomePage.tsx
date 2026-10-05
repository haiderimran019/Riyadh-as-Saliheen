import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Compass, Heart, MessageCircle, RotateCcw, Sparkles, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION, SHOW_FEEDBACK } from '../config'
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
  const [dailyMoment, setDailyMoment] = useState(() => new Date())
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [dailyHadith, setDailyHadith] = useState<Awaited<ReturnType<typeof hadithRepository.getDailyHadith>> | null>(null)
  const [dailyTranslation, setDailyTranslation] = useState<TranslationChapterDataset | null>(null)
  const [quran, setQuran] = useState<DailyQuranDataset | null>(null)
  const showDiacritics = useShowDiacritics()
  const { language, t } = useI18n()

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
  const numberLocale = language === 'ur' ? 'ur-PK' : 'en-US'
  const readUrl = progress
    ? `/collection/${DEFAULT_COLLECTION}/chapter/${progress.chapterId}#${progress.hadithId}`
    : firstChapter ? `/collection/${DEFAULT_COLLECTION}/chapter/${firstChapter.id}` : '/library'

  return (
    <main className="welcome page-with-nav riyad-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-text">
          <p className="eyebrow"><span className="home-hero-kicker">{t('THE GARDENS OF THE RIGHTEOUS')}</span> <span className="home-hero-divider" aria-hidden="true">✦</span> <bdi className="home-hero-arabic" lang="ar" dir="rtl">رياض الصالحين</bdi></p>
          <h1 id="home-title">{t('Riyad as-Salihin')}</h1>
          <p className="home-intro">{t('Read Riyad as-Salihin with the Arabic text and English translation, one chapter and one hadith at a time.')}</p>
          <div className="home-actions">
            <Link className="primary-action" to={readUrl}><BookOpen size={19} /> {t(progress ? 'Continue reading' : 'Start reading')} <ArrowRight size={18} /></Link>
            <Link className="home-secondary-action" to={`/collection/${DEFAULT_COLLECTION}`}>{t('Browse all chapters')} <ArrowRight size={17} /></Link>
          </div>
          <p className="home-hero-count">{collection ? `${new Intl.NumberFormat(numberLocale).format(collection.chapters.length)} ${t('Chapters')} · ${new Intl.NumberFormat(numberLocale).format(collection.recordIds?.length ?? 0)} ${t('hadith')}` : DATA_MODE === 'placeholder' ? t('Preview edition · text not included') : t('Loading the collection…')}</p>
        </div>
        <div className="home-hero-art" aria-hidden="true"><span className="garden-arch"><span lang="ar" dir="rtl">رياض<br />الصالحين</span></span><i>{t('IMAM AL-NAWAWI · A CLASSIC COLLECTION')}</i></div>
      </section>

      {(dailyHadith || quran) && <section className="daily-reading" aria-labelledby="daily-reading-title">
        <header className="daily-reading-heading"><p className="eyebrow">{t('TODAY’S READINGS')}</p><span id="daily-reading-title">{t('Hadith of the day')} <i aria-hidden="true">·</i> {t('Ayah of the day')}</span></header>
        <div className="daily-reading-grid">
          {dailyHadith && <section className="daily-card daily-hadith" aria-labelledby="daily-hadith-title">
            <p className="eyebrow"><Sparkles size={14} /> {t('Hadith of the day')}</p>
            <p className="daily-arabic" lang="ar" dir="rtl">{showDiacritics ? dailyHadith.arabic : stripArabicDiacritics(dailyHadith.arabic)}</p>
            {language === 'en' && dailyTranslation?.translations[dailyHadith.id] && <p className="daily-translation" lang="en" dir="ltr">{dailyTranslation.translations[dailyHadith.id].text}</p>}
            {language === 'en' && !dailyTranslation?.translations[dailyHadith.id] && <p className="daily-missing-translation">{t('English translation is not available for this narration; the Arabic text above is from the source edition.')}</p>}
            {language === 'ur' && <p className="daily-missing-translation" lang="ur">{t('The Urdu translation for this collection is not available yet. The Arabic source text is shown.')}</p>}
            <div className="daily-card-footer">
              <span id="daily-hadith-title" className="daily-reference"><bdi dir={language === 'ur' ? 'rtl' : 'ltr'}>{t('Riyad as-Salihin')}</bdi><span className="reference-separator">·</span><span dir="rtl">{t('Hadith')} <bdi dir="ltr">{dailyHadith.chapterNumber || dailyHadith.number}</bdi></span></span>
              <Link to={`/collection/${DEFAULT_COLLECTION}/chapter/${dailyHadith.chapterId}#${dailyHadith.id}`}>{t('Read hadith')} <ArrowRight size={16} /></Link>
            </div>
          </section>}
          {quran && quran.ayahs.length > 0 && (() => {
            const ayah = selectDailyAyah(quran, dailyMoment)
            const localized = ayah.translations[language]
            const direction = language === 'ur' ? 'rtl' : 'ltr'
            return <section className="daily-card daily-ayah" aria-labelledby="daily-ayah-title">
              <p className="eyebrow"><Sparkles size={14} /> {t('Ayah of the day')}</p>
              <p className="daily-arabic" lang="ar" dir="rtl">{ayah.arabic_text}</p>
              <p className="daily-translation" lang={language} dir={direction}>{withIsolatedFootnoteMarkers(localized.translation, language)}</p>
              {localized.footnotes && <details className="daily-footnotes"><summary>{t('Translation notes')}</summary><p lang={language} dir={direction}>{withIsolatedFootnoteMarkers(localized.footnotes, language)}</p></details>}
              <div className="daily-card-footer">
                <span id="daily-ayah-title" className="daily-reference"><bdi dir="rtl">{t('Qur’an')}</bdi><span className="reference-separator">·</span><bdi dir="ltr">{ayah.sura}:{ayah.aya}</bdi></span>
                <bdi className="daily-source-line" dir="ltr">QuranEnc.com · {quran.translations[language].title} · v{quran.translations[language].version}</bdi>
              </div>
            </section>
          })()}
        </div>
      </section>}

      {collection && <section className="everyday-section" aria-labelledby="everyday-title">
        <div className="everyday-heading">
          <div><p className="eyebrow">{t('A READING PATH FOR EVERYDAY LIFE')}</p><h2 id="everyday-title">{t('Choose a theme. Read at your pace.')}</h2></div>
          <p>{t('Thoughtful starting points, each opening an original chapter of Riyad as-Salihin.')}</p>
        </div>
        <div className="everyday-grid">
          {everydayThemes.map(({ chapterId, title, Icon }, index) => {
            const chapter = collection.chapters.find((item) => item.id === chapterId)
            if (!chapter) return null
            return <Link className="everyday-card" key={chapterId} to={`/collection/${DEFAULT_COLLECTION}/chapter/${chapter.id}`}>
              <span className="everyday-card-top"><span className="everyday-icon"><Icon size={19} strokeWidth={1.8} /></span><span className="everyday-index">{String(index + 1).padStart(2, '0')}</span></span>
              <strong>{t(title)}</strong>
              <span className="everyday-card-foot"><span>{t('Chapter')} <bdi dir="ltr">{chapter.id}</bdi> · {chapter.count.toLocaleString(language === 'ur' ? 'ur-PK' : 'en-US')} {t('hadith')}</span><ArrowRight size={16} aria-hidden="true" /></span>
            </Link>
          })}
        </div>
      </section>}

      <section className="home-explore" aria-label={t('Explore Riyad as-Salihin')}>
        <div className="section-title"><div><p className="eyebrow">{t('THE COLLECTION')}</p><h2>{t('Browse chapters')}</h2></div><Link to={`/collection/${DEFAULT_COLLECTION}`}>{t('All chapters')} <ArrowRight size={17} /></Link></div>
        <div className="home-link-grid">
          {progress && <Link className="home-link-card home-progress-card" to={readUrl}><span className="home-link-icon"><BookOpen size={22} /></span><span><strong>{t('Continue reading')}</strong><small>{t('Chapter')} {progress.chapterId} · {t('Hadith')} {progress.hadithId.split('-')[0]}</small></span><ArrowRight size={19} /></Link>}
          {collection?.chapters.slice(0, 4).map((chapter) => <Link className="home-link-card home-chapter-card" key={chapter.id} to={`/collection/${DEFAULT_COLLECTION}/chapter/${chapter.id}`}><span className="home-chapter-index">{chapter.id.padStart(2, '0')}</span><span><strong dir="auto">{getChapterTitle(chapter, language)}</strong><small>{chapter.count.toLocaleString('en-US')} {t('hadith')}</small></span><ArrowRight size={19} /></Link>)}
          {!collection && <div className="home-data-note"><BookOpen size={19} /><span>{DATA_MODE === 'placeholder' ? t('Reading text is not bundled in this preview yet.') : t('The chapter list could not be loaded right now.')}</span></div>}
        </div>
      </section>
      <div className="home-bottomline"><span>{t('No account. No ads. No tracking.')}</span><span><Link to="/sources">{t('Text & sources')}</Link>{SHOW_FEEDBACK && <> · <Link to="/feedback">{t('Feedback')}</Link></>}</span></div>
    </main>
  )
}
