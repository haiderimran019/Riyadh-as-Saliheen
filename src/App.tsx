import { Suspense, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bell, BookMarked, BookOpen, Bookmark, ChevronRight, Flower2, House, Menu, Moon, MoreHorizontal, Search, Settings2, ShieldCheck, UserRound, X } from 'lucide-react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { DATA_MODE } from './config'
import { ReadingControlsSheet } from './components/ReadingControlsSheet'
import { SiteFooter } from './components/SiteFooter'
import { FeedbackModal } from './components/FeedbackModal'
import { LanguagePicker } from './components/LanguagePicker'
import { routeFeatures } from './features/registry'
import { AppLocaleProvider, useI18n } from './i18n'
import { Seo } from './ssr/Seo'
import { AccountProvider,useAccount } from './services/AccountContext'
import { APP_EVENTS, dispatchAppEvent } from './core/appEvents'

const navigation = [
  { path: '/', label: 'Today', Icon: House, end: true },
  { path: '/library', label: 'The collection', Icon: BookOpen },
  { path: '/quran', label: 'The Quran', Icon: BookMarked },
  { path: '/prayers', label: 'Prayer times', Icon: Moon },
  { path: '/search', label: 'Search', Icon: Search },
  { path: '/saved', label: 'Saved passages', Icon: Bookmark },
  { path: '/reminders', label: 'Reminders', Icon: Bell },
]
export function App() { return <AppLocaleProvider><AccountProvider><AppShell /></AccountProvider></AppLocaleProvider> }

function AppShell() {
  const { t } = useI18n()
  const { account } = useAccount()
  const routeLocation = useLocation()
  const location = {...routeLocation,pathname:routeLocation.pathname.replace(/\/+$/,'')||'/'}
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [readingSettingsOpen, setReadingSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const menuWasOpenRef = useRef(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const isReader = location.pathname.includes('/chapter/')
  const section = isReader ? 'Reading room' : location.pathname.startsWith('/collection') || location.pathname === '/library' ? 'The collection' : location.pathname === '/quran' || location.pathname.startsWith('/quran/') ? 'The Quran' : location.pathname === '/prayers' ? 'Prayer times' : location.pathname === '/saved' ? 'Saved passages' : location.pathname === '/' ? 'Today' : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)
  useEffect(() => {
    const media = window.matchMedia('(max-width:700px)')
    const update = () => { setIsMobile(media.matches); if (!media.matches) setMenuOpen(false) }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!menuOpen && menuWasOpenRef.current) menuButtonRef.current?.focus()
    menuWasOpenRef.current = menuOpen
  }, [menuOpen])
  useEffect(() => { document.body.classList.toggle('menu-is-open', menuOpen || readingSettingsOpen); return () => document.body.classList.remove('menu-is-open') }, [menuOpen, readingSettingsOpen])
  useEffect(() => {
    const update = (event: Event) => setReadingSettingsOpen((event as CustomEvent<boolean>).detail)
    window.addEventListener(APP_EVENTS.readingSettingsState, update)
    return () => window.removeEventListener(APP_EVENTS.readingSettingsState, update)
  }, [])
  useEffect(() => { setMenuOpen(false); if (!location.hash) window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); inputRef.current?.focus() }
      if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus() }
      if (menuOpen && event.key === 'Tab') {
        const items = [...(sidebarRef.current?.querySelectorAll<HTMLElement>('a,button') ?? [])]
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    window.addEventListener('keydown', keyboard)
    if (menuOpen) sidebarRef.current?.querySelector<HTMLElement>('a')?.focus()
    return () => window.removeEventListener('keydown', keyboard)
  }, [menuOpen])
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let active = true
    const appScope = new URL(import.meta.env.BASE_URL, window.location.origin)
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const owned = registrations.filter((registration) => new URL(registration.scope).pathname.startsWith(appScope.pathname) && !new URL(registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || appScope.href).pathname.endsWith('/reminders-sw.js'))
      if (owned.length === 0) return
      await Promise.all(owned.map((registration) => registration.unregister()))
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const appPrefix = `${window.location.origin}${appScope.pathname}`
        await Promise.all(cacheNames.filter((name) => name.startsWith('hadith-content-') || (name.startsWith('workbox-precache-') && name.includes(appPrefix))).map((name) => caches.delete(name)))
      }
      if (active && navigator.serviceWorker.controller && sessionStorage.getItem('riyad-cleared-legacy-worker') !== '1') {
        sessionStorage.setItem('riyad-cleared-legacy-worker', '1')
        window.location.reload()
      }
    })().catch(() => undefined)
    return () => { active = false }
  }, [])
  return <div className={`app-shell ${isReader ? 'reading-shell' : ''}`}>
    <Seo/><a className="skip-link" href="#main-content">{t('Skip to content')}</a>
    {menuOpen && <button className="nav-scrim" aria-label={t('Close menu')} onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus() }} />}
    <aside inert={readingSettingsOpen || isMobile && !menuOpen ? true : undefined} ref={sidebarRef} className={`workspace-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label={t('Main menu')}>
      <Link className="wordmark" to="/" aria-label={t('Riyad as-Salihin home')}><Flower2 size={34} strokeWidth={1.25} /><span><strong>Riyad<span className="wordmark-dot">.</span></strong><small>AS-SALIHIN</small></span></Link>
      <button className="menu-close icon-button" aria-label={t('Close menu')} onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus() }}><X size={20} /></button>
      <div className="sidebar-intro"><p lang="ar" dir="rtl">رياض الصالحين</p><span>{t('A space for what matters.')}</span></div>
      <nav className="workspace-navigation" aria-label={t('Primary navigation')}>
        {navigation.map(({ path, label, Icon, end }) => <NavLink aria-label={t(label)} key={path} to={path} end={end} className={({ isActive }) => (isActive || path === '/library' && location.pathname.startsWith('/collection')) ? 'is-active' : ''}><Icon size={19} strokeWidth={1.65} /><span>{t(label)}</span><ChevronRight size={14} className="nav-chevron" /></NavLink>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-line" /><p>{t('Read slowly.')}<br />{t('Return often.')}</p></div><Link className="sidebar-utility" to="/account"><UserRound size={18}/>{t(account ? 'Your account' : 'Sign in')}</Link><NavLink className="sidebar-utility" to="/settings"><Settings2 size={18} />{t('Settings')}</NavLink><Link className="sidebar-utility" to="/sources"><ShieldCheck size={18} />{t('Sources & credits')}<ArrowUpRight size={14} /></Link><small className="sidebar-privacy">{t('Your space, on your terms.')}</small></div>
    </aside>
    <div className="workspace-body" inert={readingSettingsOpen || isMobile && menuOpen ? true : undefined}>
      <header className="workspace-topbar">
        <div className="workspace-breadcrumb"><button ref={menuButtonRef} className="menu-toggle icon-button" aria-label={t('Open menu')} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={22} /></button><span className="desktop-crumb">{t('Your reading space')}</span><ChevronRight className="desktop-crumb" size={14} /><span>{t(section)}</span></div>
        <form className="global-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`) }}><Search size={17} /><input ref={inputRef} aria-label={t('Search the collection')} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search the collection')} /><kbd>⌘ K</kbd></form>
        <div className="workspace-topbar-actions"><LanguagePicker /></div>
      </header>
      {DATA_MODE === 'placeholder' && <p className="preview-banner" role="status">{t('Preview build: content is being added')}</p>}
      <div id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" role="status"><BookOpen size={26} /><span>{t('Opening the collection')}</span></div>}><Routes>
          <Route path="/collection/hadeethenc" element={<Navigate to="/library" replace />} />
          <Route path="/collection/hadeethenc/chapter/:chapterId" element={<Navigate to="/library" replace />} />
          {routeFeatures.map(({ path, page: Page }) => <Route key={path} path={path} element={<Page />} />)}
          <Route path="*" element={<main className="feature-page"><h1>Page not found</h1><p>This page is unavailable.</p><Link className="primary-action" to="/">Return to Riyad</Link></main>} />
        </Routes></Suspense>
      </div>
      <SiteFooter />
      <nav className="mobile-floating-navigation" aria-label={t('Mobile navigation')}><NavLink to="/" end aria-label={t('Today')}><House size={20}/><span>{t('Today')}</span></NavLink><NavLink to="/library" aria-label={t('Hadith')}><BookOpen size={20}/><span>{t('Hadith')}</span></NavLink><NavLink to="/quran" aria-label={t('Quran')}><BookMarked size={20}/><span>{t('Quran')}</span></NavLink><NavLink to="/prayers" aria-label={t('Prayers')}><Moon size={20}/><span>{t('Prayers')}</span></NavLink><button aria-label={t('Reading settings')} aria-haspopup="dialog" aria-controls="reading-settings-dialog" aria-expanded={readingSettingsOpen} onClick={()=>dispatchAppEvent(APP_EVENTS.openReadingSettings)}><MoreHorizontal size={20}/><span>{t('More')}</span></button></nav>
    </div>
    <ReadingControlsSheet /><FeedbackModal />
  </div>
}
