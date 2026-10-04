import { Link } from 'react-router-dom'
import { APP_VERSION, DATA_LAST_UPDATED, DATA_VERSION, SHOW_FEEDBACK } from '../config'

export const CAUTION_TEXT = "This app is prepared by people, and people can make mistakes in selecting, displaying or translating content. Hadith texts, translations and grades are provided by HadeethEnc.com and shown unmodified. This app is for reading and learning and is not a source of religious rulings (fatwa); please consult a qualified scholar. If you find a mistake or have a suggestion, please tell us using the Feedback button."

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section><h2>About</h2><p>A free reader with no ads, tracking, or personal names.</p><Link to="/about">Read about the app</Link></section>
        <section><h2>Sources and credits</h2><p>Hadith text, translations and grades: HadeethEnc.com, shown unmodified.</p><Link to="/sources">View sources and credits</Link></section>
        <section><h2>Privacy</h2><p>No accounts, analytics or cookies. Data stays on this device. Feedback is sent by email through a form service.</p><Link to="/privacy">Read the privacy notice</Link></section>
        <section><h2>Terms and disclaimer</h2><p>This reader supports learning; it does not provide religious rulings.</p><Link to="/terms">Read terms and disclaimer</Link></section>
      </div>
      {SHOW_FEEDBACK && <div className="footer-actions"><Link className="footer-button" to="/feedback">Send feedback</Link><Link to="/feedback?type=mistake">Report an error</Link></div>}
      <p className="caution-text">{CAUTION_TEXT}</p>
      <p className="footer-meta">App {APP_VERSION} · Data {DATA_VERSION} · Last updated {DATA_LAST_UPDATED}. Code is MIT licensed; content is not covered by the code licence.</p>
    </footer>
  )
}
