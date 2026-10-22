import { Flower2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SHOW_FEEDBACK } from '../config'
import { useI18n } from '../i18n'
export const CAUTION_TEXT = "This app is prepared by people, and people can make mistakes in selecting, displaying or translating content. Hadith texts, translations and grades are shown as received from their credited source. This app is for reading and learning and is not a source of religious rulings (fatwa); please consult a qualified scholar. If you find a mistake or have a suggestion, please tell us using the Feedback button."
export function SiteFooter() {
  const { t } = useI18n()
  return <footer className="site-footer"><div className="footer-topline"><Link className="footer-signature" to="/"><Flower2 size={20} strokeWidth={1.2} />{t('Riyad as-Salihin')}</Link><nav className="footer-links" aria-label={t('Footer')}><Link to="/about">{t('About')}</Link><Link to="/sources">{t('Sources & credits')}</Link><Link to="/privacy">{t('Privacy')}</Link><Link to="/terms">{t('Terms')}</Link>{SHOW_FEEDBACK && <Link to="/feedback">{t('Feedback')}</Link>}</nav></div></footer>
}
