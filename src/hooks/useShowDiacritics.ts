import { useEffect, useState } from 'react'
import { APP_EVENTS } from '../core/appEvents'
import { getSetting } from '../data/db'

export function useShowDiacritics() {
  const [showDiacritics, setShowDiacritics] = useState(true)

  useEffect(() => {
    void getSetting('showDiacritics', true).then(setShowDiacritics)
    const update = (event: Event) => setShowDiacritics((event as CustomEvent<{ showDiacritics: boolean }>).detail.showDiacritics)
    window.addEventListener(APP_EVENTS.readingPreferencesChange, update)
    return () => window.removeEventListener(APP_EVENTS.readingPreferencesChange, update)
  }, [])

  return showDiacritics
}
