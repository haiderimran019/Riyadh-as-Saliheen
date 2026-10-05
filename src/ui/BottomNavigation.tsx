import { useEffect, useState } from 'react'
import { Type } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { navigationFeatures } from '../features/registry'
import { useI18n } from '../i18n'

export function BottomNavigation() {
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const update = (event: Event) => setSettingsOpen(Boolean((event as CustomEvent<boolean>).detail))
    window.addEventListener(APP_EVENTS.readingSettingsState, update)
    return () => window.removeEventListener(APP_EVENTS.readingSettingsState, update)
  }, [])

  return (
    <nav className="floating-nav" aria-label={t('Primary navigation')}>
      {navigationFeatures.map(({ path, label, ariaLabel, icon: Icon, end }) => (
        <NavLink key={path} to={path} end={end} aria-label={t(ariaLabel)}>
          <Icon size={20} /><span>{t(label)}</span>
        </NavLink>
      ))}
      <button type="button" aria-label={t('Reading settings')} aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={() => dispatchAppEvent(APP_EVENTS.openReadingSettings)}>
        <Type size={20} /><span>Aa</span>
      </button>
    </nav>
  )
}
