import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { hadithRepository } from '../data/HadithRepository'
import { db, type ReadingProgress } from '../data/db'
import type { CollectionIndex } from '../types/hadith'
import { TopicTree } from '../components/TopicTree'

export function CollectionPage() {
  const { collectionId = '' } = useParams()
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [chapterQuery, setChapterQuery] = useState('')

  useEffect(() => {
    hadithRepository.getCollection(collectionId).then(setCollection).catch((reason: Error) => setError(reason.message))
    db.progress.get(collectionId).then((value) => setProgress(value ?? null))
  }, [collectionId])

  const visibleChapters = collection?.chapters.filter((chapter) => `${chapter.id} ${chapter.title}`.toLocaleLowerCase().includes(chapterQuery.trim().toLocaleLowerCase())) ?? []

  return (
    <main className="content-page page-with-nav">
      <Link className="back-link" to="/"><ArrowLeft size={17} /> Library</Link>
      {error && <p className="notice error">{error}</p>}
      {collection && <>
        <header className="page-heading">
          <p className="eyebrow">Collection</p>
          <h1>{collection.title}</h1>
          <p>{collection.description}</p>
          {progress && <Link className="continue-link" to={`/collection/${collectionId}/chapter/${progress.chapterId}#${progress.hadithId}`}>Continue where you left off</Link>}
        </header>
        <section aria-labelledby="chapters-title">
          <div className="section-title">
            <h2 id="chapters-title">Chapters</h2>
            <span>{collection.chapters.length} chapters</span>
          </div>
          <label className="chapter-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Find a chapter</span><input type="search" value={chapterQuery} onChange={(event) => setChapterQuery(event.target.value)} placeholder="Find a chapter by title or number" /></label>
          {collection.categories && collection.roots && !chapterQuery ? <TopicTree collectionId={collection.id} categories={collection.categories} chapters={collection.chapters} roots={collection.roots} /> : <div className="chapter-list">
            {visibleChapters.length === 0 && <p className="empty-state">No chapters match “{chapterQuery}”.</p>}
            {visibleChapters.map((chapter) => (
              <Link className="chapter-row" key={chapter.id} to={`/collection/${collection.id}/chapter/${chapter.id}`}>
                <span className="chapter-index">{chapter.id.padStart(2, '0')}</span>
                <span><strong>{chapter.title}</strong><small>{chapter.count} hadith</small></span>
                <ChevronRight aria-hidden="true" />
              </Link>
            ))}
          </div>}
        </section>
      </>}
    </main>
  )
}
