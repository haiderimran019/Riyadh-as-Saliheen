import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CAUTION_TEXT } from '../components/SiteFooter'
import { useI18n } from '../i18n'

export function SourcesPage() {
  const { t, language } = useI18n()
  return (
    <main className="content-page narrow page-with-nav">
      <Link className="back-link" to="/library"><ArrowLeft size={17} /> {t('The collection')}</Link>
      <header className="page-heading">

        <h1>{t('Sources & credits')}</h1>
        <p>{t('Every reading must keep its text, translation, and license attached to the source that supplied it.')}</p>
      </header>
      <section className="source-status"><h2>{t('Riyad as-Salihin · Arabic')}</h2><p>{t('Arabic text and original chapter order are sourced from IslamHouse.com / IslamEnc.com. The app preserves the source wording and reference numbering; only the page layout is reflowed for reading.')}</p></section>
      <section className="source-status"><h2>{t('English translation')}</h2><p>{t('The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source’s hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.')}</p></section>
      <section className="source-status">
        <h2>{language === 'ur' ? 'اردو · مماثل روایات' : 'Urdu · matching narrations'}</h2>
        <p>{language === 'ur' ? <>دستیاب اردو تراجم <bdi dir="ltr">HadeethEnc.com</bdi> کی شائع شدہ مماثل روایات کے ہیں، مکمل ریاض الصالحین کے نہیں۔ اصل عربی عبارت کے واضح مماثلت کی جانچ کے بعد ترجمہ بغیر تبدیلی کے شامل ہوتا ہے۔ ریاض کے نسخے کی اضافی عبارت مختلف ہو سکتی ہے؛ ترجمے کے ساتھ اس کی اصل عربی عبارت اور ماخذ کا نسخہ بھی دستیاب ہے۔ باقی احادیث میں اردو ترجمہ نہ ہونے کی اطلاع دی جاتی ہے۔ یہ تراجم اس ایپ کی ٹیم نے نظرِ ثانی نہیں کیے۔</> : 'Available Urdu text is from HadeethEnc.com’s published matching narrations, not a complete Urdu edition of Riyad as-Salihin. Only unambiguous full-Arabic wording matches are included. The Urdu text is unchanged; additional wording in the Riyad edition may differ. Each translation identifies its edition and includes its corresponding source Arabic. Other entries show an unavailable notice. Translations are not reviewed by this app’s team.'}</p>
        <p><a href="https://hadeethenc.com/ur/home">{language === 'ur' ? 'ناشر اور استعمال کی شرائط' : 'Publisher and content-use terms'}</a></p>
      </section>
      <section className="source-status"><h2>{t('Ayah of the day')}</h2><p>{t('Daily Quranic Arabic and English/Urdu meanings are provided by QuranEnc.com. The app preserves the API text and footnotes; source edition, translator, version and retrieval date are bundled with each build. The selection rotates every six hours.')}</p></section>
      <section className="source-status"><h2>The Quran reader</h2><p>The complete Quran reader uses QuranEnc.com Arabic, unchanged English translation and supplied notes. English Translation - Noor International Center, version 1.1.2, contains 114 surahs and 6,236 ayahs in this import. Chapter names and verse counts are from Quran Foundation. The reader displays publisher and edition details alongside the text.</p><a href="https://quranenc.com/en/home/api/">QuranEnc source and API</a></section>
      <section className="source-status"><h2>{t('Reuse terms')}</h2><p>{t('The IslamHouse API Hub content policy permits use in apps when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse’s content policy and is not covered by the code licence.')}</p><p>{language === 'ur' ? <>اردو مماثل روایات <bdi dir="ltr">HadeethEnc.com</bdi> کی شرائط کے مطابق اصل صورت، ناشر کی نسبت اور ترجمے کے نسخے کے ساتھ دکھائی جاتی ہیں۔</> : 'Urdu matching narrations follow HadeethEnc.com’s terms: unchanged text, clear publisher credit, and the published translation edition. The importer checks the current edition at build time.'}</p><p>{t('QuranEnc translations are republished unmodified with publisher attribution, edition version, and supplied footnotes. The build importer checks the currently published edition metadata.')}</p></section>
      <section className="source-caution"><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p></section>
    </main>
  )
}
