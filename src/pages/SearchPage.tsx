import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SearchPage() {
  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">Coming with the reading text</p>
        <h1>Search</h1>
        <p>Search will be available as soon as the Arabic Riyad text is ready to read offline.</p>
      </header>
      <section className="search-pending"><span><BookOpen size={22} /></span><div><strong>Search is paused, not broken.</strong><p>No other collection will appear in results while this edition is being prepared.</p><Link to="/library">View the collection page</Link></div></section>
    </main>
  )
}
