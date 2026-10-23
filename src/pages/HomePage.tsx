import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, BookMarked, BookOpen, Flower2, LocateFixed, MapPin, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBootData } from '../ssr/BootData'
import { db, type ReadingProgress, type QuranProgress } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import { loadDailyQuran, loadTranslation } from '../data/loader'
import { DEFAULT_COLLECTION } from '../config'
import { useI18n } from '../i18n'
import { useShowDiacritics } from '../hooks/useShowDiacritics'
import { stripArabicDiacritics } from '../utils/arabicText'
import { selectDailyAyah } from '../utils/dailyHadith'
import { useLocationData } from '../services/LocationContext'
import { usePrayer } from '../hooks/usePrayer'
import { hadithReadingUrl, quranReadingUrl } from '../services/readingPlace'
import { quranSurah } from '../services/reading'
import { defaultEdition, quranEditions } from '../../shared/quran-editions.mjs'
import type { DailyQuranDataset, TranslationChapterDataset } from '../types/hadith'
import type { QuranSura } from '../ssr/BootData'

export function HomePage(){
  const boot=useBootData(),{t,language}=useI18n(),showDiacritics=useShowDiacritics()
  const [moment,setMoment]=useState(()=>new Date(boot.now||Date.now()))
  const [hadith,setHadith]=useState(boot.dailyHadith||null),[translation,setTranslation]=useState<TranslationChapterDataset|null>(boot.dailyTranslation||null)
  const [quran,setQuran]=useState<DailyQuranDataset|null>(boot.dailyQuran||null),[ayahMeaning,setAyahMeaning]=useState<QuranSura|null>(null)
  const [progress,setProgress]=useState<ReadingProgress|null>(null),[quranProgress,setQuranProgress]=useState<QuranProgress|null>(null)
  const {location,locate,locating,live}=useLocationData(),{current,school}=usePrayer()
  const ayah=quran?selectDailyAyah(quran,moment):null,edition=quranEditions.find(x=>x.key===defaultEdition(language))!
  const meaning=ayahMeaning?.result.find(x=>Number(x.aya)===ayah?.aya&&Number(x.sura)===ayah.sura)
  const locale=language==='ur'?'ur-PK':language==='bn'?'bn-BD':language==='ar'?'ar':'en-GB'
  const readHadith=progress?hadithReadingUrl(progress):`/collection/${DEFAULT_COLLECTION}/chapter/1`
  const readQuran=quranProgress?quranReadingUrl(quranProgress.surah,quranProgress.ayah):'/quran/1'
  useEffect(()=>{let active=true;void hadithRepository.getDailyHadith(moment).then(async record=>{if(!active)return;setHadith(record||null);setTranslation(null);if(record&&['en','ur'].includes(language)){const collection=await hadithRepository.getCollection(DEFAULT_COLLECTION),chapter=collection.chapters.find(x=>x.id===record.chapterId);if(chapter){const dataset=await loadTranslation(language,DEFAULT_COLLECTION,chapter.file).catch(()=>null);if(active)setTranslation(dataset)}}}).catch(()=>undefined);void loadDailyQuran().then(value=>{if(active)setQuran(value)}).catch(()=>undefined);void db.progress.get(DEFAULT_COLLECTION).then(value=>{if(active)setProgress(value||null)});void db.quranProgress.get('quran').then(value=>{if(active)setQuranProgress(value||null)});const timer=setInterval(()=>setMoment(new Date()),60000);return()=>{active=false;clearInterval(timer)}},[language,moment.toISOString().slice(0,13)])
  useEffect(()=>{let active=true;setAyahMeaning(null);if(ayah)void quranSurah(Number(ayah.sura),edition.key).then(value=>{if(active)setAyahMeaning(value)}).catch(()=>undefined);return()=>{active=false}},[ayah?.sura,edition.key])
  const time=(value:string|null)=>value?new Intl.DateTimeFormat(locale,{timeZone:location?.timezone||'UTC',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value)):''
  const translated=hadith&&translation?.translations[hadith.id]
  return <main className="daily-overview">
    <header className="overview-heading"><div><h1>{t('A day with meaning.')}</h1><p>{t('A little Quran. A little reflection. Room for every prayer.')}</p></div><time dateTime={moment.toISOString()}>{new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',timeZone:location?.timezone||'UTC'}).format(moment)}</time></header>
    <div className="overview-opening"><section className="overview-garden"><img src={`${import.meta.env.BASE_URL}images/reading-garden.png`} alt="" fetchPriority="high"/><div><Flower2 size={25} strokeWidth={1.2}/><h2>{t('Make yourself a little space.')}</h2><span lang="ar" dir="rtl">رياض الصالحين</span></div></section><section className="overview-prayer" aria-label={t('Prayer now')}><header><Moon size={20} strokeWidth={1.3}/><span>{t(current?.mode||'Your prayer, wherever you are')}</span><Link to="/prayers" aria-label={t('Open prayer times')}><ArrowUpRight size={19}/></Link></header>{current?<><div className="prayer-now-time"><h2>{t(current.name[0].toUpperCase()+current.name.slice(1))}</h2><time dateTime={current.time!}>{time(current.time)}</time></div><p>{t(school==='hanafi'?'Hanafi':'Shafi')}{current.ends&&<> · {t('Until')} {time(current.ends)}</>}</p><footer><MapPin size={14}/>{t(location?.label||'Current location')}<span>{t(live&&location?.source==='gps'?'Live':'Saved location')}</span></footer></>:<><h2>{t('In time. In presence.')}</h2><p>{t('Use GPS to see the prayer for this moment.')}</p><button data-track="location.request" onClick={locate} disabled={locating}><LocateFixed size={17}/>{t(locating?'Finding your location…':'Use my location')}<ArrowRight size={16}/></button></>}</section></div>
    <nav className="overview-reading-paths" aria-label={t('Continue reading')}><Link to={readQuran}><BookMarked size={25} strokeWidth={1.25}/><span><strong>{t('The Quran')}</strong><small>{quranProgress?`${t('Surah')} ${quranProgress.surah} · ${t('Ayah')} ${quranProgress.ayah}`:t('Begin with Al-Fatihah')}</small></span><span>{t(quranProgress?'Continue':'Open')}<ArrowRight size={16}/></span></Link><Link to={readHadith}><BookOpen size={25} strokeWidth={1.25}/><span><strong>{t('Riyad as-Salihin')}</strong><small>{progress?`${t('Chapter')} ${progress.chapterId} · ${t('Hadith')} ${progress.hadithId.split('-')[0]}`:t('Begin with intention')}</small></span><span>{t(progress?'Continue':'Open')}<ArrowRight size={16}/></span></Link></nav>
    <div className="overview-readings"><section className="overview-quran"><header className="overview-section-title"><h2>{t('An ayah for your day')}</h2><Link to={ayah?quranReadingUrl(Number(ayah.sura),Number(ayah.aya)):'/quran'}>{t('Read Quran')}<ArrowUpRight size={17}/></Link></header>{ayah?<><p className="overview-arabic" lang="ar" dir="rtl">{showDiacritics?ayah.arabic_text:stripArabicDiacritics(ayah.arabic_text)}</p>{meaning&&language!=='ar'&&<p className="overview-meaning" lang={edition.language} dir={edition.language==='ur'?'rtl':'ltr'}>{meaning.translation}</p>}{meaning?.footnotes&&<details><summary>{t('Translation notes')}</summary><p lang={edition.language} dir={edition.language==='ur'?'rtl':'ltr'}>{meaning.footnotes}</p></details>}<footer><span>{t('Quran')} {ayah.sura}:{ayah.aya}</span><small>{meaning?`${edition.title} · ${edition.publisher}`:'QuranEnc.com'}</small></footer></>:<p className="loading-copy">{t('Opening today’s reading…')}</p>}</section>
    <section className="overview-hadith"><header className="overview-section-title"><h2>{t('Wisdom to carry with you')}</h2><Link to={hadith?hadithReadingUrl({collectionId:DEFAULT_COLLECTION,chapterId:hadith.chapterId,hadithId:hadith.id,updatedAt:0}):'/library'}>{t('Read hadith')}<ArrowUpRight size={17}/></Link></header>{hadith?<><p className="overview-arabic" lang="ar" dir="rtl">{showDiacritics?hadith.arabic:stripArabicDiacritics(hadith.arabic)}</p>{translated&&language!=='ar'&&<p className="overview-meaning" lang={language} dir={language==='ur'?'rtl':'ltr'}>{translated.text}</p>}{language==='bn'&&<p className="feature-footnote">{t('Bengali hadith translation is not supplied by this edition. The Arabic text is complete.')}</p>}{language==='ur'&&translated?.raw&&<p className="feature-footnote">{t('Urdu · matching narration')} · {t('This Urdu text translates HadeethEnc’s matching narration; additional wording in the Riyad edition may differ.')}</p>}<footer><span>{t('Hadith')} {hadith.number}</span><small>{translation?.metadata.sourceName||hadith.sourceName||'IslamHouse / IslamEnc'}</small></footer></>:<p className="loading-copy">{t('Opening today’s reading…')}</p>}</section></div>
    <div className="overview-bottom"><span>{t('Return at your own pace.')}</span><Link to="/saved">{t('Saved passages')}<ArrowRight size={16}/></Link><Link to="/reminders">{t('Gentle reminders')}<ArrowRight size={16}/></Link></div>
  </main>
}
