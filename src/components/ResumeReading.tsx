import { useEffect, useState } from 'react'
import { ArrowRight, BookMarked, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type QuranProgress, type ReadingProgress } from '../data/db'
import { useI18n } from '../i18n'
import { hadithReadingUrl, quranReadingUrl } from '../services/readingPlace'

export function ResumeReading({ only }: { only?: 'quran' }) {
  const { t } = useI18n()
  const [hadith, setHadith] = useState<ReadingProgress>()
  const [quran, setQuran] = useState<QuranProgress>()
  useEffect(() => {
    let active = true
    void Promise.all([only ? Promise.resolve(undefined) : db.progress.orderBy('updatedAt').last(), db.quranProgress.get('quran')])
      .then(([h, q]) => { if (active) { setHadith(h); setQuran(q) } }).catch(() => undefined)
    return () => { active = false }
  }, [only])
  if (!hadith && !quran) return null
  return <section className="resume-readings" aria-label={t('Continue reading')}>
    {hadith && <Link to={hadithReadingUrl(hadith)}><BookOpen size={21}/><span><strong>{t('Continue hadith')}</strong><small>{t('Chapter')} {hadith.chapterId} · {t('Hadith')} {hadith.hadithId.split('-')[0]}</small></span><ArrowRight size={18}/></Link>}
    {quran && <Link to={quranReadingUrl(quran.surah, quran.ayah)}><BookMarked size={21}/><span><strong>{t('Continue Quran')}</strong><small>{t('Surah')} {quran.surah} · {t('Ayah')} {quran.ayah}</small></span><ArrowRight size={18}/></Link>}
  </section>
}
