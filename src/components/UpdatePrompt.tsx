import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <aside className="update-prompt" role="status" aria-live="polite">
      <span>A new version is ready.</span>
      <button type="button" onClick={() => void updateServiceWorker(true)}>Update</button>
      <button type="button" aria-label="Dismiss update message" onClick={() => setNeedRefresh(false)}>Later</button>
    </aside>
  )
}
