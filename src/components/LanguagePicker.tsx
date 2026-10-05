import { useI18n } from '../i18n'

export function LanguagePicker() {
  const { language, setLanguage, t } = useI18n()
  return <div className="settings-language-control" role="group" aria-label={t('App language')}>
    <button type="button" aria-label="English" title="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <button type="button" lang="ur" aria-label="اردو (Urdu)" title="اردو" aria-pressed={language === 'ur'} onClick={() => setLanguage('ur')}>اردو</button>
  </div>
}
