import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_VERSION, FEEDBACK_ENABLED, FEEDBACK_ENDPOINT, FEEDBACK_KEY } from '../config'
import { useI18n } from '../i18n'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackModal() {
  const { t, language } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const open = location.pathname === '/feedback'
  const [type, setType] = useState(params.get('type') === 'mistake' ? 'Mistake in hadith or translation' : 'Suggestion')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const close = () => navigate(-1)

  useEffect(() => {
    if (!open) return
    setType(params.get('type') === 'mistake' ? 'Mistake in hadith or translation' : 'Suggestion')
    setStatus('idle')
    setError('')
    messageRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); return }
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]') ?? [])].filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, params])

  if (!open) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!message.trim()) { setError(t('Please enter a message.')); return }
    if (message.length > 2000) { setError(t('Please keep the message to 2,000 characters.')); return }
    if (website) { setStatus('success'); return }
    const previous = Number(localStorage.getItem('feedback-last-sent') ?? 0)
    if (Date.now() - previous < 30_000) { setError(t('Please wait a moment before sending again.')); return }
    setStatus('submitting')
    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: FEEDBACK_KEY, type, message: message.trim(), reply_email: replyEmail.trim() || undefined, hadith_id: params.get('hadith') || undefined, language, app_version: APP_VERSION }),
      })
      if (!response.ok) throw new Error(t('The feedback service did not accept the message.'))
      localStorage.setItem('feedback-last-sent', String(Date.now()))
      setStatus('success')
    } catch (reason) {
      setStatus('error')
      setError(reason instanceof Error ? reason.message : t('Unable to send feedback. Please try again.'))
    }
  }

  return (
    <>
      <button className="feedback-backdrop" aria-label={t('Close feedback')} onClick={close} />
      <section ref={dialogRef} className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <header><div><p className="eyebrow">{t('Help improve the app')}</p><h2 id="feedback-title">{t('Send feedback')}</h2></div><button className="icon-button" aria-label={t('Close feedback')} onClick={close}><X /></button></header>
        {!FEEDBACK_ENABLED ? (import.meta.env.DEV ? <p className="notice">{t('Feedback is unavailable in development until the feedback service is configured.')}</p> : null) : status === 'success' ? <div className="feedback-result" role="status"><h3>{t('Thank you')}</h3><p>{t('Your feedback was sent.')}</p><button onClick={close}>{t('Close')}</button></div> : (
          <form onSubmit={submit}>
            <label><span>{t('Type')}</span><select value={type} onChange={(event) => setType(event.target.value)}>{['Mistake in hadith or translation', 'Bug', 'Suggestion', 'Other'].map((option) => <option key={option} value={option}>{t(option)}</option>)}</select></label>
            <label><span>{t('Message')} <strong>{t('Required')}</strong></span><textarea ref={messageRef} required maxLength={2000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} /><small>{message.length}/2000</small></label>
            <label><span>{t('Reply email')} <small>{t('Optional')}</small></span><input type="email" autoComplete="email" value={replyEmail} onChange={(event) => setReplyEmail(event.target.value)} /></label>
            <label className="honeypot" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="service-note">{t('Sending contacts the third-party form service at')} {new URL(FEEDBACK_ENDPOINT).host}, {t('only when you submit.')}</p>
            <button className="submit-button" type="submit" disabled={status === 'submitting'}>{t(status === 'submitting' ? 'Sending…' : 'Send feedback')}</button>
          </form>
        )}
      </section>
    </>
  )
}
