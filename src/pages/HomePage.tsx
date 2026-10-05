import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Bookmark, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION, SHOW_FEEDBACK } from '../config'
import { db, type ReadingProgress } from '../data/db'
import { hadithRepository } from '../data/HadithRepository'
import type { CollectionIndex } from '../types/hadith'

export function HomePage() {
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)

  useEffect(() => {
    if (DATA_MODE !== 'real') return
    void hadithRepository.getCollection(DEFAULT_COLLECTION).then(setCollection).catch(() => undefined)
    void db.progress.get(DEFAULT_COLLECTION).then((value) => setProgress(value ?? null))
  }, [])

  const firstChapter = collection?.chapters[0]
  const readUrl = progress
    ? `/collection/${DEFAULT_COLLECTION}/chapter/${progress.chapterId}#${progress.hadithId}`
    : firstChapter ? `/collection/${DEFAULT_COLLECTION}/chapter/${firstChapter.id}` : '/library'

  return (
    <main className="welcome page-with-nav riyad-home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-text">
          <p className="eyebrow">THE GARDENS OF THE RIGHTEOUS <span aria-hidden="true">—</span> رياض الصالحين</p>
          <h1 id="home-title">A place to return to the words.</h1>
          <p className="home-intro">Read Riyad as-Salihin with the Arabic text and English translation, one chapter and one hadith at a time.</p>
          <div className="home-actions">
            <Link className="primary-action" to={readUrl}><BookOpen size={19} /> {progress ? 'Continue reading' : 'Start reading'} <ArrowRight size={18} /></Link>
            <Link className="home-secondary-action" to="/search"><Search size={19} /> Search the collection</Link>
          </div>
          <p className="home-hero-count">{collection ? `${collection.chapters.length} chapters · ${(collection.recordIds?.length ?? 0).toLocaleString()} hadith` : 'Arabic and English · available offline'}</p>
        </div>
        <div className="home-hero-art" aria-hidden="true"><span className="garden-arch"><span>رياض<br />الصالحين</span></span><i>R I Y A D</i></div>
      </section>

      <section className="home-explore" aria-label="Explore Riyad as-Salihin">
        <div className="section-title"><div><p className="eyebrow">YOUR READING</p><h2>Make room for reflection.</h2></div><Link to={`/collection/${DEFAULT_COLLECTION}`}>All chapters <ArrowRight size={17} /></Link></div>
        <div className="home-link-grid">
          <Link className="home-link-card" to={readUrl}><span className="home-link-icon"><BookOpen size={22} /></span><span><strong>{progress ? 'Pick up where you left off' : 'Begin with Chapter 1'}</strong><small>{progress ? `Chapter ${progress.chapterId} · Hadith ${progress.hadithId.split('-')[0]}` : firstChapter?.title.replace(/^\d+\s*[-–—]\s*/, '') ?? 'The collection opens with intention.'}</small></span><ArrowRight size={19} /></Link>
          <Link className="home-link-card" to="/saved"><span className="home-link-icon"><Bookmark size={22} /></span><span><strong>Your saved passages</strong><small>Keep meaningful readings close, privately on this device.</small></span><ArrowRight size={19} /></Link>
        </div>
      </section>
      <div className="home-bottomline"><span>No account. No ads. No tracking.</span><span><Link to="/sources">Text & sources</Link>{SHOW_FEEDBACK && <> · <Link to="/feedback">Feedback</Link></>}</span></div>
    </main>
  )
}
