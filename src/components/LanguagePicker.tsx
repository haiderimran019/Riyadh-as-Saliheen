import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
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

  const choose = (next: string) => { setLanguage(next); void setSetting('language', next); dispatchAppEvent(APP_EVENTS.languageChange, next) }
  return <div className="settings-language-control" role="group" aria-label="Translation language">
    <Languages size={18} aria-hidden="true" />
    <button type="button" aria-pressed={language === 'en'} onClick={() => choose('en')}>English</button>
    <button type="button" lang="ar" aria-pressed={language === 'ar'} onClick={() => choose('ar')}>العربية</button>
  </div>
}
