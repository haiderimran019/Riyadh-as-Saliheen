import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { loadAllHadith } from '../data/loader'
import { createHadithSearch, type SearchableHadith } from '../search'

export function SearchPage() {
  const [records, setRecords] = useState<SearchableHadith[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const index = useMemo(() => createHadithSearch(records), [records])
  const recordById = useMemo(() => new Map(records.map((record) => [record.id, record])), [records])

  useEffect(() => {
    loadAllHadith().then(setRecords).catch((reason: Error) => setError(reason.message))
  }, [])

  const results = query.trim()
    ? index.search(query).map((result) => recordById.get(String(result.id))).filter(Boolean) as SearchableHadith[]
    : []

  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">Arabic-first discovery</p>
        <h1>Search</h1>
        <p>Arabic search ignores tashkeel and normalizes common alef, ya, and ta marbuta variants.</p>
      </header>
      <label className="search-box">
        <Search aria-hidden="true" />
        <span className="sr-only">Search hadith</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Arabic text, number, book…" autoFocus />
      </label>
      {error && <p className="notice error">{error}</p>}
      <div className="search-results" aria-live="polite">
        {query && <p className="result-count">{results.length} result{results.length === 1 ? '' : 's'}</p>}
        {results.map((record) => (
          <Link className="search-result" key={record.id} to={`/collection/${record.collectionId}/chapter/${record.chapterId}#${record.id}`}>
            <span className="label">Hadith {record.number} · Chapter {record.chapter}</span>
            <p dir="rtl" lang="ar">{record.arabic}</p>
            <small>{record.collection} · {record.book}</small>
          </Link>
        ))}
      </div>
    </main>
  )
}
