import { lazy, Suspense } from 'react'
import { BookOpen, Bookmark, House, Search, Type } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { APP_NAME } from './config'
import { InstallPrompt } from './components/InstallPrompt'
import { LanguagePicker } from './components/LanguagePicker'

const CollectionPage = lazy(() => import('./pages/CollectionPage').then((module) => ({ default: module.CollectionPage })))
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })))
const ReaderPage = lazy(() => import('./pages/ReaderPage').then((module) => ({ default: module.ReaderPage })))
const SavedPage = lazy(() => import('./pages/SavedPage').then((module) => ({ default: module.SavedPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((module) => ({ default: module.SearchPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((module) => ({ default: module.SourcesPage })))

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

      <div id="main-content" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" role="status">Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/collection/:collectionId" element={<CollectionPage />} />
            <Route path="/collection/:collectionId/chapter/:chapterId" element={<ReaderPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </div>

      <InstallPrompt />

      <nav className="floating-nav" aria-label="Primary navigation">
        <NavLink to="/" end aria-label="Home"><House size={20} /><span>Home</span></NavLink>
        <NavLink to="/library" aria-label="Library"><BookOpen size={20} /><span>Library</span></NavLink>
        <NavLink to="/search"><Search size={20} /><span>Search</span></NavLink>
        <NavLink to="/saved"><Bookmark size={20} /><span>Saved</span></NavLink>
        <NavLink to="/settings" aria-label="Reading settings"><Type size={20} /><span>Reading settings</span></NavLink>
      </nav>
    </div>
  )
}
