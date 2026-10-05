import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n'

export function UpdatePrompt() {
  const { t } = useI18n()
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <aside className="update-prompt" role="status" aria-live="polite">
      <span>{t('A new version is ready.')}</span>
      <button type="button" onClick={() => void updateServiceWorker(true)}>{t('Update')}</button>
      <button type="button" aria-label={t('Later')} onClick={() => setNeedRefresh(false)}>{t('Later')}</button>
    </aside>
  )
}
