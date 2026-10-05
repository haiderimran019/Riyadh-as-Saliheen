import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, Languages, MessageSquareText, SlidersHorizontal } from 'lucide-react'
import { SHOW_FEEDBACK } from '../config'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { LanguagePicker } from '../components/LanguagePicker'
import { useI18n } from '../i18n'

export function SettingsPage() {
  const { t } = useI18n()
  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact settings-heading">
        <p className="eyebrow">{t('On-device preferences')}</p>
        <h1>{t('Settings')}</h1>
        <p>{t('A gentle moment for thoughtful reading.')}</p>
      </header>
      <section className="settings-group" aria-labelledby="settings-reader-title">
        <p id="settings-reader-title" className="settings-group-label">{t('Reading display')}</p>
        <div className="settings-list">
          <button className="setting-row setting-row-button" onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}><span className="setting-icon"><SlidersHorizontal size={20} /></span><span className="setting-copy"><strong>{t('Text appearance')}</strong><small>{t('Arabic and translation size, theme, and diacritics.')}</small></span><ChevronRight size={18} /></button>
          <div className="setting-row setting-language-row"><span className="setting-icon"><Languages size={20} /></span><span className="setting-copy"><strong>{t('App language')}</strong><small>{t('Choose the language for menus and reading tools.')}</small></span><LanguagePicker /></div>
        </div>
      </section>
      <section className="settings-group" aria-labelledby="settings-info-title">
        <p id="settings-info-title" className="settings-group-label">{t('About this edition')}</p>
        <div className="settings-list">
          <Link className="setting-row setting-row-link" to="/sources"><span className="setting-icon"><BookOpen size={20} /></span><span className="setting-copy"><strong>{t('Sources and credits')}</strong><small>{t('Review every Arabic dataset and translation independently.')}</small></span><ChevronRight size={18} /></Link>
          {SHOW_FEEDBACK && <Link className="setting-row setting-row-link" to="/feedback"><span className="setting-icon"><MessageSquareText size={20} /></span><span className="setting-copy"><strong>{t('Feedback')}</strong><small>{t('Report a mistake, bug, or suggestion.')}</small></span><ChevronRight size={18} /></Link>}
        </div>
      </section>
    </main>
  )
}
