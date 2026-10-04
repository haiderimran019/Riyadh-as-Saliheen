import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { loadSources } from '../data/loader'
import type { SourceCredit } from '../types/hadith'
import { CAUTION_TEXT } from '../components/SiteFooter'

export function SourcesPage() {
  const [sources, setSources] = useState<SourceCredit[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadSources().then((value) => setSources(value.sources)).catch((reason: Error) => setError(reason.message))
  }, [])

  return (
    <main className="content-page narrow page-with-nav">
      <Link className="back-link" to="/"><ArrowLeft size={17} /> Library</Link>
      <header className="page-heading">
        <p className="eyebrow">Transparency</p>
        <h1>Sources & credits</h1>
        <p>Every Arabic dataset and translation is credited separately. Placeholder entries below contain no real religious content.</p>
      </header>
      {error && <p className="notice error">{error}</p>}
      <div className="source-list">
        {sources.map((source) => (
          <article className="source-card" key={`${source.kind}-${source.language ?? 'ar'}-${source.metadata.sourceUrl}`}>
            <div className="source-card-header">
              <span className="label">{source.kind === 'arabic' ? 'Arabic dataset' : `${source.language?.toUpperCase()} translation`}</span>
              {source.metadata.placeholder && <span className="placeholder-badge">Placeholder</span>}
            </div>
            <h2>{source.metadata.sourceName}</h2>
            <dl>
              <div><dt>{source.metadata.contributorRole}</dt><dd>{source.metadata.contributor}</dd></div>
              <div><dt>Licence</dt><dd>{source.metadata.license}</dd></div>
              <div><dt>Date retrieved</dt><dd>{source.metadata.dateRetrieved}</dd></div>
            </dl>
            <span className="source-link">Source record <ExternalLink size={15} /></span>
          </article>
        ))}
      </div>
      <section className="source-caution"><h2>Important caution</h2><p>{CAUTION_TEXT}</p></section>
    </main>
  )
}
