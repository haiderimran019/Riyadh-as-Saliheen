import { Link } from 'react-router-dom'
import { SHOW_FEEDBACK } from '../config'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'

export function SettingsPage() {
  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">On-device preferences</p>
        <h1>Settings</h1>
      </header>
      <div className="settings-list">
        <div className="setting-row"><span><strong>Reading display</strong><small>Arabic and translation size, theme, and diacritics.</small></span><button className="settings-action" onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}>Open</button></div>
        <div className="setting-row">
          <span><strong>Sources and credits</strong><small>Review every Arabic dataset and translation independently.</small></span>
          <Link to="/sources">View</Link>
        </div>
        {SHOW_FEEDBACK && <div className="setting-row"><span><strong>Feedback</strong><small>Report a mistake, bug, or suggestion.</small></span><Link to="/feedback">Send feedback</Link></div>}
      </div>
    </main>
  )
}
