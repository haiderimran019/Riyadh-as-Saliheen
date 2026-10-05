import { Suspense } from 'react'
import { BookOpen, Search, Settings2 } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { DATA_MODE } from './config'
import { ReadingControlsSheet } from './components/ReadingControlsSheet'
import { SiteFooter } from './components/SiteFooter'
import { FeedbackModal } from './components/FeedbackModal'
import { routeFeatures } from './features/registry'
import { BottomNavigation } from './ui/BottomNavigation'
import { AppLocaleProvider, useI18n } from './i18n'
import { useEffect, useState } from 'react'

const HomeFallback = routeFeatures[0].page

export function App() {
  return <AppLocaleProvider><AppShell /></AppLocaleProvider>
}

function AppShell() {
  const { t } = useI18n()
  const [showBismillah, setShowBismillah] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setShowBismillah(false), 3000)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let active = true
    const appScope = new URL(import.meta.env.BASE_URL, window.location.origin)
    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      const owned = registrations.filter((registration) => new URL(registration.scope).pathname.startsWith(appScope.pathname))
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
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('Skip to content')}</a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label={t('Riyad as-Salihin home')}>
          <span className="brand-mark" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" /></span>
          <span className="brand-copy"><strong>{t('Riyad as-Salihin')}</strong><small lang="ar" dir="rtl">رياض الصالحين</small></span>
        </Link>
        <nav className="topbar-actions" aria-label={t('Quick links')}>
          <Link className="topbar-search" to="/search"><Search size={18} /><span>{t('Search')}</span></Link>
          <Link className="topbar-settings" to="/settings" aria-label={t('Settings')} title={t('Settings')}><Settings2 size={20} /><span>{t('Settings')}</span></Link>
        </nav>
      </header>
      {DATA_MODE === 'placeholder' && <p className="preview-banner" role="status">{t('Preview build: content is being added')}</p>}

      <div id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" role="status"><span className="route-loading-mark" aria-hidden="true"><BookOpen size={23} /></span><span>{t('Opening the collection')}</span><i aria-hidden="true" /></div>}>
          <Routes>
            <Route path="/collection/hadeethenc" element={<Navigate to="/library" replace />} />
            <Route path="/collection/hadeethenc/chapter/:chapterId" element={<Navigate to="/library" replace />} />
            {routeFeatures.map(({ path, page: Page }) => <Route key={path} path={path} element={<Page />} />)}
            <Route path="*" element={<HomeFallback />} />
          </Routes>
        </Suspense>
      </div>

      <SiteFooter />
      <ReadingControlsSheet />
      <FeedbackModal />

      <BottomNavigation />
      {showBismillah && <div className="bismillah-splash" aria-label="بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" role="status"><span className="splash-mark" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt="" /></span><p lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p><span className="splash-rule" aria-hidden="true" /></div>}
    </div>
  )
}
