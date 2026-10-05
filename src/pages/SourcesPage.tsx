import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CAUTION_TEXT } from '../components/SiteFooter'
import { useI18n } from '../i18n'

export function SourcesPage() {
  const { t, language } = useI18n()
  return (
    <main className="content-page narrow page-with-nav">
      <Link className="back-link" to="/"><ArrowLeft size={17} /> {t('Library')}</Link>
      <header className="page-heading">
        <p className="eyebrow">{t('Transparency')}</p>
        <h1>{t('Sources & credits')}</h1>
        <p>{t('Every reading must keep its text, translation, and license attached to the source that supplied it.')}</p>
      </header>
      <section className="source-status"><h2>{t('Riyad as-Salihin · Arabic')}</h2><p>{t('Arabic text and original chapter order are sourced from IslamHouse.com / IslamEnc.com. The app preserves the source wording and reference numbering; only the page layout is reflowed for reading.')}</p></section>
      <section className="source-status"><h2>{t('English translation')}</h2><p>{t('The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source’s hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.')}</p>{language === 'ur' && <p lang="ur">اس نسخے میں ریاض الصالحین کا مستند، ہم آہنگ اردو ترجمہ شامل نہیں۔ اردو منتخب کرنے پر اصل عربی متن دکھایا جاتا ہے؛ کسی دوسرے مجموعے کا متن اس کتاب سے منسوب نہیں کیا جاتا۔</p>}</section>
      <section className="source-status"><h2>{t('Ayah of the day')}</h2><p>{t('Daily Quranic Arabic and English/Urdu meanings are provided by QuranEnc.com. The app preserves the API text and footnotes; source edition, translator, version and retrieval date are bundled with each build. The selection rotates every six hours.')}</p></section>
      <section className="source-status"><h2>{t('Reuse terms')}</h2><p>{t('The IslamHouse API Hub content policy permits use in apps when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse’s content policy and is not covered by the code licence.')}</p><p>{t('QuranEnc translations are republished unmodified with publisher attribution, edition version, and supplied footnotes. The build importer checks the currently published edition metadata.')}</p></section>
      <section className="source-caution"><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p></section>
    </main>
  )
}
