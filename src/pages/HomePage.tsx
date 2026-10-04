import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { loadAllHadith, loadCollections } from '../data/loader'
import { selectDailyHadith } from '../utils/dailyHadith'
import type { CollectionsManifest } from '../types/hadith'

export function HomePage() {
  const [manifest, setManifest] = useState<CollectionsManifest | null>(null)
  const [error, setError] = useState('')
  const [daily, setDaily] = useState<Awaited<ReturnType<typeof loadAllHadith>>[number] | undefined>()

  useEffect(() => {
    loadCollections().then(setManifest).catch((reason: Error) => setError(reason.message))
    loadAllHadith().then((records) => setDaily(selectDailyHadith(records, new Date()))).catch(() => undefined)
  }, [])

  return (
    <main className="welcome page-with-nav">
      <p className="eyebrow">Private by design · Works offline</p>
      <h1>A quiet place to read and reflect.</h1>
      <p className="lede">Browse carefully sourced collections without accounts, ads, analytics, or tracking.</p>
      {error && <p className="notice error">{error}</p>}
      {daily && (
        <section className="daily-card" aria-labelledby="daily-title">
          <div>
            <span className="label">Hadith of the day</span>
            <h2 id="daily-title">Today’s reading</h2>
          </div>
          <p dir="rtl" lang="ar">{daily.arabic}</p>
          <footer>
            <span>{daily.collection} · no. {daily.number}</span>
            <span>{daily.grades.length > 0 ? daily.grades.map((grade) => `${grade.grade} · ${grade.grader}`).join('; ') : 'Grade not available'}</span>
            <Link to={`/collection/${daily.collectionId}/chapter/${daily.chapterId}#${daily.id}`}>Open reading</Link>
          </footer>
        </section>
      )}
      <div className="collection-grid">
        {manifest?.collections.map((collection) => (
          <Link className="collection-card" to={`/collection/${collection.id}`} key={collection.id}>
            <div>
              <span className="label">Collection</span>
              <h2>{collection.title}</h2>
              <p>{collection.description}</p>
            </div>
            <div className="collection-action">
              {collection.placeholder && <span className="placeholder-badge">Placeholder data</span>}
              <ArrowRight aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
