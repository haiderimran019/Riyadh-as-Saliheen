import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE } from '../config'
import { hadithRepository } from '../data/HadithRepository'
import type { CollectionsManifest } from '../types/hadith'

export function LibraryPage() {
  const [manifest, setManifest] = useState<CollectionsManifest | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    hadithRepository.listCollections().then(setManifest).catch((reason: Error) => setError(reason.message))
  }, [])

  return (
    <main className="content-page page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">Browse</p>
        <h1>Library</h1>
        <p>Choose a collection, then browse by chapter.</p>
      </header>
      {error && <p className="notice error">{DATA_MODE === 'placeholder' ? 'This preview build does not include hadith content.' : 'Hadith data could not be loaded. Please try again.'}</p>}
      <div className="collection-grid">
        {manifest?.collections.map((collection) => (
          <Link className="collection-card" to={`/collection/${collection.id}`} key={collection.id}>
            <div>
              <span className="label">Collection</span>
              <h2>{collection.title}</h2>
              <p>{collection.description}</p>
            </div>
            <div className="collection-action">
              <ArrowRight aria-hidden="true" />
            </div>
          </Link>
        ))}
        <article className="collection-card collection-card-pending" aria-labelledby="riyad-title">
          <div>
            <span className="label">Coming soon</span>
            <h2 id="riyad-title">Riyad as-Salihin</h2>
            <p>Not included until redistribution rights for its translation are clear.</p>
          </div>
        </article>
      </div>
    </main>
  )
}
