import { Link } from 'react-router-dom'
import { SHOW_FEEDBACK } from '../config'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { LanguagePicker } from '../components/LanguagePicker'
import { useI18n } from '../i18n'

export function SettingsPage() {
  const { t } = useI18n()
  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">{t('On-device preferences')}</p>
        <h1>{t('Settings')}</h1>
      </header>
      <div className="settings-list">
        <div className="setting-row"><span><strong>{t('Reading display')}</strong><small>{t('Arabic and translation size, theme, and diacritics.')}</small></span><button className="settings-action" onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}>{t('Open')}</button></div>
        <div className="setting-row setting-language-row"><span><strong>{t('App language')}</strong><small>{t('Choose the language for menus and reading tools.')}</small></span><LanguagePicker /></div>
        <div className="setting-row">
          <span><strong>{t('Sources and credits')}</strong><small>{t('Review every Arabic dataset and translation independently.')}</small></span>
          <Link to="/sources">{t('View')}</Link>
        </div>
        {SHOW_FEEDBACK && <div className="setting-row"><span><strong>{t('Feedback')}</strong><small>{t('Report a mistake, bug, or suggestion.')}</small></span><Link to="/feedback">{t('Send feedback')}</Link></div>}
      </div>
    </main>
  )
}
