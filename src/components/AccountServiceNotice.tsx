import { BookOpen,ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
export function AccountServiceNotice(){const{t}=useI18n();return <section className="account-service-notice"><ShieldCheck size={30} strokeWidth={1.3}/><h2>{t('Reading is open to everyone.')}</h2><p>{t('Hadith, Quran, bookmarks and prayer times are available here without an account.')}</p><p>{t('Accounts and scheduled notifications need the connected account service, which is not hosted on this GitHub Pages website yet.')}</p><Link className="primary-action" to="/library"><BookOpen size={17}/>{t('Explore the collection')}</Link></section>}
