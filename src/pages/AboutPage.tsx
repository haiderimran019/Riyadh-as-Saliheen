import { CAUTION_TEXT } from '../components/SiteFooter'
import { APP_VERSION, DATA_VERSION } from '../config'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export function AboutPage() {
  const { t } = useI18n()
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><h1>{t('A quiet, private reader')}</h1><p>{t('Read Quran, hadith and prayer times together with your Google account. Analytics, location sharing and reminders each require a separate choice. Reading preferences and bookmarks remain on your device.')}</p></header><section><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p><p>{t('Source text is preserved as published. Translation editions and credits are shown beside each reading.')}</p></section><section><h2>{t('Sources & credits')}</h2><p>{t('Hadith: IslamHouse / IslamEnc. Urdu matching narrations: HadeethEnc, partial coverage. Quran meanings: QuranEnc and Tanzil. IndoPak text: Quran Foundation / QuranWBW.')}</p><Link className="text-action" to="/sources">{t('Sources & credits')}</Link></section><section><h2>{t('About this edition')}</h2><p>{t('Google sign-in opens the app. Location sharing, analytics and reminders are optional.')}</p><p>v{APP_VERSION} · {DATA_VERSION} · {t('Code MIT; content terms vary by source.')}</p></section></main>
}
