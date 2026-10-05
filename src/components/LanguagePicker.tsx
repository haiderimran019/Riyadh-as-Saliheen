import { useEffect, useState } from 'react'
import { Globe2 } from 'lucide-react'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { getSetting, setSetting } from '../data/db'

export function LanguagePicker() {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    void getSetting('language', 'en').then(setLanguage)
    const update = (event: Event) => setLanguage((event as CustomEvent<string>).detail)
    window.addEventListener(APP_EVENTS.languageChange, update)
    return () => window.removeEventListener(APP_EVENTS.languageChange, update)
  }, [])

  return (
    <label className="header-language">
      <Globe2 size={16} aria-hidden="true" />
      <span className="sr-only">Translation language</span>
      <select aria-label="Translation language" value={language} onChange={(event) => { const next = event.target.value; setLanguage(next); void setSetting('language', next); dispatchAppEvent(APP_EVENTS.languageChange, next) }}>
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </label>
  )
}
