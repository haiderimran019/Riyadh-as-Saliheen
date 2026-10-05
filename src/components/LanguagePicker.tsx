import { Languages } from 'lucide-react'
import { useI18n } from '../i18n'

export function LanguagePicker() {
  const { language, setLanguage, t } = useI18n()
  return <div className="settings-language-control" role="group" aria-label={t('App language')}>
    <Languages size={18} aria-hidden="true" />
    <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
    <button type="button" lang="ur" aria-pressed={language === 'ur'} onClick={() => setLanguage('ur')}>{t('Urdu')}</button>
  </div>
}
