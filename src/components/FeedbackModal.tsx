import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_VERSION, FEEDBACK_ENABLED, FEEDBACK_ENDPOINT, FEEDBACK_KEY } from '../config'
import { getSetting } from '../data/db'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function FeedbackModal() {
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
  }, [open])

  if (!open) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!message.trim()) { setError('Please enter a message.'); return }
    if (message.length > 2000) { setError('Please keep the message to 2,000 characters.'); return }
    if (website) { setStatus('success'); return }
    const previous = Number(localStorage.getItem('feedback-last-sent') ?? 0)
    if (Date.now() - previous < 30_000) { setError('Please wait a moment before sending again.'); return }
    setStatus('submitting')
    try {
      const language = await getSetting('language', 'en')
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: FEEDBACK_KEY, type, message: message.trim(), reply_email: replyEmail.trim() || undefined, hadith_id: params.get('hadith') || undefined, language, app_version: APP_VERSION }),
      })
      if (!response.ok) throw new Error('The feedback service did not accept the message.')
      localStorage.setItem('feedback-last-sent', String(Date.now()))
      setStatus('success')
    } catch (reason) {
      setStatus('error')
      setError(reason instanceof Error ? reason.message : 'Unable to send feedback. Please try again.')
    }
  }

  return (
    <>
      <button className="feedback-backdrop" aria-label="Close feedback" onClick={close} />
      <section ref={dialogRef} className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <header><div><p className="eyebrow">Help improve the app</p><h2 id="feedback-title">Send feedback</h2></div><button className="icon-button" aria-label="Close feedback" onClick={close}><X /></button></header>
        {!FEEDBACK_ENABLED ? (import.meta.env.DEV ? <p className="notice">Feedback is unavailable in development until VITE_FEEDBACK_ENDPOINT and VITE_FEEDBACK_KEY are configured.</p> : null) : status === 'success' ? <div className="feedback-result" role="status"><h3>Thank you</h3><p>Your feedback was sent.</p><button onClick={close}>Close</button></div> : (
          <form onSubmit={submit}>
            <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value)}><option>Mistake in hadith or translation</option><option>Bug</option><option>Suggestion</option><option>Other</option></select></label>
            <label><span>Message <strong>Required</strong></span><textarea ref={messageRef} required maxLength={2000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} /><small>{message.length}/2000</small></label>
            <label><span>Reply email <small>Optional</small></span><input type="email" autoComplete="email" value={replyEmail} onChange={(event) => setReplyEmail(event.target.value)} /></label>
            <label className="honeypot" aria-hidden="true"><span>Website</span><input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="service-note">Sending contacts the third-party form service at {new URL(FEEDBACK_ENDPOINT).host}, only when you submit.</p>
            <button className="submit-button" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : 'Send feedback'}</button>
          </form>
        )}
      </section>
    </>
  )
}
