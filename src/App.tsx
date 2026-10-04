import { useEffect, useState } from 'react'
import { BookOpen, Moon, Sun } from 'lucide-react'
import { APP_NAME } from './config'
import { loadCollections } from './data/loader'
import type { CollectionsManifest } from './types/hadith'

type Theme = 'light' | 'dark' | 'sepia'

export function App() {
  const [theme, setTheme] = useState<Theme>('light')
  const [manifest, setManifest] = useState<CollectionsManifest | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    loadCollections().then(setManifest).catch((reason: Error) => setError(reason.message))
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label={`${APP_NAME} home`}>
          <span className="brand-mark" aria-hidden="true"><BookOpen size={20} /></span>
          {APP_NAME}
        </a>
        <div className="theme-switcher" aria-label="Reading theme">
          <button aria-label="Light theme" data-active={theme === 'light'} onClick={() => setTheme('light')}><Sun size={17} /></button>
          <button aria-label="Sepia theme" data-active={theme === 'sepia'} onClick={() => setTheme('sepia')}>Aa</button>
          <button aria-label="Dark theme" data-active={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={17} /></button>
        </div>
      </header>
      <main className="welcome">
        <p className="eyebrow">Private by design · Works offline</p>
        <h1>A quiet place to read and reflect.</h1>
        <p className="lede">Browse verified collections without accounts, ads, analytics, or tracking.</p>
        {error && <p className="notice error">{error}</p>}
        {manifest?.collections.map((collection) => (
          <article className="collection-card" key={collection.id}>
            <div>
              <span className="label">Collection</span>
              <h2>{collection.title}</h2>
              <p>{collection.description}</p>
            </div>
            {collection.placeholder && <span className="placeholder-badge">Placeholder data</span>}
          </article>
        ))}
      </main>
    </div>
  )
}
