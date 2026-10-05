import { Link } from 'react-router-dom'
import { APP_VERSION, DATA_LAST_UPDATED, DATA_VERSION, SHOW_FEEDBACK } from '../config'
import { useI18n } from '../i18n'

export const CAUTION_TEXT = "This app is prepared by people, and people can make mistakes in selecting, displaying or translating content. Hadith texts, translations and grades are shown as received from their credited source. This app is for reading and learning and is not a source of religious rulings (fatwa); please consult a qualified scholar. If you find a mistake or have a suggestion, please tell us using the Feedback button."

export function SiteFooter() {
  const { t, language } = useI18n()
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label={t('Footer')}>
        <Link to="/about">{t('About')}</Link><Link to="/sources">{t('Sources & credits')}</Link><Link to="/privacy">{t('Privacy')}</Link><Link to="/terms">{t('Terms')}</Link>
        {SHOW_FEEDBACK && <Link to="/feedback">{t('Feedback')}</Link>}
      </nav>
      <div className="footer-credits">
        <p className="footer-credit">{language === 'ur' ? <>ریاض الصالحین کا عربی متن اور انگریزی ترجمہ: <bdi dir="ltr">IslamHouse.com / IslamEnc.com</bdi>؛ اصل صورت میں۔</> : 'Riyad text and English translation: IslamHouse.com / IslamEnc.com, shown as published.'}</p>
        <p className="footer-credit">{language === 'ur' ? <>قرآنی ترجمے: <bdi dir="ltr">QuranEnc.com</bdi>؛ نسخے کا حوالہ اور ورژن آج کی آیت کے ساتھ درج ہیں۔</> : 'Quran meanings: QuranEnc.com; edition and version are identified with the daily ayah.'}</p>
      </div>
      <p className="footer-disclaimer">{language === 'ur' ? 'مطالعے کے لیے، شرعی فتویٰ نہیں۔ کوئی اکاؤنٹ، اشتہار، تجزیاتی نگرانی یا کوکیز نہیں۔' : 'For reading and learning, not religious rulings. No accounts, ads, analytics or cookies.'}</p>
      <details className="footer-caution"><summary>{t('Important caution')}</summary><p>{t(CAUTION_TEXT)}</p></details>
      <p className="footer-meta">
        <span>{language === 'ur' ? 'ایپ' : 'App'} <bdi dir="ltr">{APP_VERSION}</bdi></span>
        <span>{language === 'ur' ? 'مواد' : 'Data'} <bdi dir="ltr">{DATA_VERSION}</bdi></span>
        <span>{language === 'ur' ? 'تازہ کاری' : 'Updated'} <bdi dir="ltr">{DATA_LAST_UPDATED}</bdi></span>
        <span>{language === 'ur' ? <>کوڈ <bdi dir="ltr">MIT</bdi>؛ مواد ماخذ کی شرائط کے تابع۔</> : 'Code MIT; content terms vary by source.'}</span>
      </p>
    </footer>
  )
}
