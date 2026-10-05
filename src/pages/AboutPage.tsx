import { CAUTION_TEXT } from '../components/SiteFooter'
import { useI18n } from '../i18n'

export function AboutPage() {
  const { t } = useI18n()
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><p className="eyebrow">{t('About')}</p><h1>{t('A quiet, private reader')}</h1><p>{t('This free app has no ads, analytics, accounts, cookies, or personal names. Reading preferences and saved items stay on your device.')}</p></header><section><h2>{t('Important caution')}</h2><p>{t(CAUTION_TEXT)}</p></section></main>
}
