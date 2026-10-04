import { Link } from 'react-router-dom'
import { APP_VERSION, DATA_LAST_UPDATED, DATA_VERSION, SHOW_FEEDBACK } from '../config'

export const CAUTION_TEXT = "This app is prepared by people, and people can make mistakes in selecting, displaying or translating content. Hadith texts, translations and grades are shown as received from their credited source. This app is for reading and learning and is not a source of religious rulings (fatwa); please consult a qualified scholar. If you find a mistake or have a suggestion, please tell us using the Feedback button."

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer">
        <Link to="/about">About</Link><Link to="/sources">Sources & credits</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link>
        {SHOW_FEEDBACK && <Link to="/feedback">Feedback</Link>}
      </nav>
      <p className="footer-credit">Riyad text and English translation: IslamHouse.com / IslamEnc.com, shown as published.</p>
      <p className="footer-disclaimer">For reading and learning, not religious rulings. No accounts, ads, analytics or cookies.</p>
      <p className="footer-meta">App {APP_VERSION} · Data {DATA_VERSION} · Updated {DATA_LAST_UPDATED} · Code MIT; content terms vary by source.</p>
    </footer>
  )
}
