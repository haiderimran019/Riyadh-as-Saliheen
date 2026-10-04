import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../data/db'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'

export const APP_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'ur', name: 'اردو' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'hi', name: 'हिन्दी' },
] as const

export function LanguagePicker() {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    getSetting('language', 'en').then(setLanguage)
  }, [])

  const chooseLanguage = (value: string) => {
    setLanguage(value)
    void setSetting('language', value)
    dispatchAppEvent(APP_EVENTS.languageChange, value)
  }

  return (
    <label className="header-language">
      <span className="sr-only">Reading language</span>
      <select aria-label="Reading language" value={language} onChange={(event) => chooseLanguage(event.target.value)}>
        {APP_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
    </label>
  )
}
