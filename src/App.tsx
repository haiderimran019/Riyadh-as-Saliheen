import { BookOpen, Bookmark, Search, Settings } from 'lucide-react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { APP_NAME } from './config'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { CollectionPage } from './pages/CollectionPage'
import { HomePage } from './pages/HomePage'
import { ReaderPage } from './pages/ReaderPage'
import { SavedPage } from './pages/SavedPage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'
import { SourcesPage } from './pages/SourcesPage'

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label={`${APP_NAME} home`}>
          <span className="brand-mark" aria-hidden="true"><BookOpen size={20} /></span>
          {APP_NAME}
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavLink to="/">Library</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/saved">Saved</NavLink>
          <NavLink to="/sources">Sources & credits</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <ThemeSwitcher />
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection/:collectionId" element={<CollectionPage />} />
        <Route path="/collection/:collectionId/chapter/:chapterId" element={<ReaderPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/"><BookOpen size={20} /><span>Library</span></NavLink>
        <NavLink to="/search"><Search size={20} /><span>Search</span></NavLink>
        <NavLink to="/saved"><Bookmark size={20} /><span>Saved</span></NavLink>
        <NavLink to="/settings"><Settings size={20} /><span>Settings</span></NavLink>
      </nav>
    </div>
  )
}
