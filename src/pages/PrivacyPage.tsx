import { FEEDBACK_ENABLED, FEEDBACK_ENDPOINT } from '../config'

export function PrivacyPage() {
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><p className="eyebrow">Privacy</p><h1>Your reading stays on your device</h1></header><section><h2>What this app stores</h2><p>Reading settings, saved hadith and progress are stored in your browser. There are no accounts, analytics or cookies.</p><h2>Feedback</h2><p>Feedback is sent only when you submit the form. The request goes to the configured third-party form service{FEEDBACK_ENABLED ? ` at ${new URL(FEEDBACK_ENDPOINT).host}` : ''}. The destination email is never included in this app.</p><h2>External requests</h2><p>The published app makes no third-party runtime requests except a feedback submission you choose to send.</p></section></main>
}
