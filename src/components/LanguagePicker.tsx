import { Globe2 } from 'lucide-react'
import { useI18n, type AppLanguage } from '../i18n'
export function LanguagePicker(){const {language,setLanguage,t}=useI18n();return <label className="language-select"><Globe2 size={16} aria-hidden="true"/><span className="sr-only">{t('App language')}</span><select aria-label={t('App language')} value={language} onChange={event=>setLanguage(event.target.value as AppLanguage)}><option value="en">English</option><option value="ur">اردو</option><option value="bn">বাংলা</option><option value="ar">العربية</option></select></label>}
