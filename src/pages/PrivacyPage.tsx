import { FEEDBACK_ENABLED, FEEDBACK_ENDPOINT } from '../config'
import { useI18n } from '../i18n'

export function PrivacyPage() {
  const { t } = useI18n()
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><p className="eyebrow">{t('Privacy')}</p><h1>{t('Your reading stays on your device')}</h1></header><section><h2>{t('What this app stores')}</h2><p>{t('Reading settings, saved hadith and progress are stored in your browser. There are no accounts, analytics or cookies.')}</p><h2>{t('Feedback')}</h2><p>{t('Feedback is sent only when you submit the form. The request goes to the configured third-party form service')}{FEEDBACK_ENABLED ? ` at ${new URL(FEEDBACK_ENDPOINT).host}` : ''}. {t('The destination email is never included in this app.')}</p><h2>{t('External requests')}</h2><p>{t('The published app makes no third-party runtime requests except a feedback submission you choose to send.')}</p></section></main>
}
