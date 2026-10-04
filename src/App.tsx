import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { APP_NAME, DATA_MODE } from './config'
import { InstallPrompt } from './components/InstallPrompt'
import { LanguagePicker } from './components/LanguagePicker'
import { ReadingControlsSheet } from './components/ReadingControlsSheet'
import { SiteFooter } from './components/SiteFooter'
import { FeedbackModal } from './components/FeedbackModal'
import { UpdatePrompt } from './components/UpdatePrompt'
import { routeFeatures } from './features/registry'
import { BottomNavigation } from './ui/BottomNavigation'

const HomeFallback = routeFeatures[0].page

export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label={`${APP_NAME} home`}>
          <span className="brand-mark" aria-hidden="true"><BookOpen size={20} /></span>
          {APP_NAME}
        </Link>
        <LanguagePicker />
      </header>
      {DATA_MODE === 'placeholder' && <p className="preview-banner" role="status">Preview build: content is being added</p>}

      <div id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" role="status"><span className="route-loading-mark" aria-hidden="true"><BookOpen size={23} /></span><span>Opening the collection</span><i aria-hidden="true" /></div>}>
          <Routes>
            <Route path="/collection/hadeethenc" element={<Navigate to="/library" replace />} />
            <Route path="/collection/hadeethenc/chapter/:chapterId" element={<Navigate to="/library" replace />} />
            {routeFeatures.map(({ path, page: Page }) => <Route key={path} path={path} element={<Page />} />)}
            <Route path="*" element={<HomeFallback />} />
          </Routes>
        </Suspense>
      </div>

      <SiteFooter />

      <InstallPrompt />
      <ReadingControlsSheet />
      <FeedbackModal />
      <UpdatePrompt />

      <BottomNavigation />
    </div>
  )
}
