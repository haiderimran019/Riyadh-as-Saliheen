import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSetting, setSetting } from '../data/db'
import { SHOW_FEEDBACK } from '../config'

export function SettingsPage() {
  const [showDiacritics, setShowDiacritics] = useState(true)
  const [arabicSize, setArabicSize] = useState(2.2)

  useEffect(() => {
    getSetting('showDiacritics', true).then(setShowDiacritics)
    getSetting('arabicSize', 2.2).then(setArabicSize)
  }, [])

  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">On-device preferences</p>
        <h1>Settings</h1>
      </header>
      <div className="settings-list">
        <label className="setting-row">
          <span><strong>Show tashkeel</strong><small>Display Arabic diacritics where present in the source.</small></span>
          <input type="checkbox" checked={showDiacritics} onChange={async (event) => { setShowDiacritics(event.target.checked); await setSetting('showDiacritics', event.target.checked) }} />
        </label>
        <label className="setting-row">
          <span><strong>Arabic text size</strong><small>Used throughout the reader.</small></span>
          <input type="range" min="1.6" max="3.4" step="0.2" value={arabicSize} onChange={async (event) => { const value = Number(event.target.value); setArabicSize(value); await setSetting('arabicSize', value) }} />
        </label>
        <div className="setting-row">
          <span><strong>Sources and credits</strong><small>Review every Arabic dataset and translation independently.</small></span>
          <Link to="/sources">View</Link>
        </div>
        {SHOW_FEEDBACK && <div className="setting-row"><span><strong>Feedback</strong><small>Report a mistake, bug, or suggestion.</small></span><Link to="/feedback">Send feedback</Link></div>}
      </div>
    </main>
  )
}
