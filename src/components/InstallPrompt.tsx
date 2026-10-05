import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useI18n } from '../i18n'

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const { t } = useI18n()
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const handler = (nextEvent: Event) => {
      nextEvent.preventDefault()
      setEvent(nextEvent as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!event) return null

  return (
    <button className="install-prompt" onClick={async () => {
      await event.prompt()
      await event.userChoice
      setEvent(null)
    }}>
      <Download size={17} /> {t('Install for offline reading')}
    </button>
  )
}
