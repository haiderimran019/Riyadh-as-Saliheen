import { CAUTION_TEXT } from '../components/SiteFooter'
import { useI18n } from '../i18n'

export function AboutPage() {
  const { t } = useI18n()
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><h1>{t('A quiet, private reader')}</h1><p>{t('Read hadith and Quran freely. Optional accounts support GPS-based prayer reminders and personal notifications. Reading preferences and saved passages remain on your device; account data and consented location are stored by the server.')}</p></header><section><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p></section></main>
}
