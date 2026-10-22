import { CAUTION_TEXT } from '../components/SiteFooter'
import { APP_VERSION, DATA_VERSION } from '../config'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export function AboutPage() {
  const { t, language } = useI18n()
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><h1>{t('A quiet, private reader')}</h1><p>{t('Read hadith and Quran freely. Optional accounts support GPS-based prayer reminders and personal notifications. Reading preferences and saved passages remain on your device; account data and consented location are stored by the server.')}</p></header><section><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p><p>{t('Source text is preserved as published. Translation editions and credits are shown beside each reading.')}</p></section><section><h2>{t('Sources & credits')}</h2><p>{language === 'ur' ? <>عربی متن اور انگریزی ترجمہ: <bdi>IslamHouse.com / IslamEnc.com</bdi>۔ اردو مماثل روایات: <bdi>HadeethEnc.com</bdi>؛ جزوی ترجمہ۔ قرآنی تراجم: <bdi>QuranEnc.com</bdi>۔</> : 'Arabic & English: IslamHouse.com / IslamEnc.com. Urdu matching narrations: HadeethEnc.com; partial coverage. Quran meanings: QuranEnc.com.'}</p><Link className="text-action" to="/sources">{t('Sources & credits')}</Link></section><section><h2>{t('About this edition')}</h2><p>{t('Reading stays open. Accounts and reminders are optional.')}</p><p>v{APP_VERSION} · {DATA_VERSION} · {t('Code MIT; content terms vary by source.')}</p></section></main>
}
