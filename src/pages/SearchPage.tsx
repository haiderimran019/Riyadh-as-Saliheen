import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION } from '../config'
import { hadithRepository } from '../data/HadithRepository'
import { loadAllTranslations } from '../data/loader'
import { createHadithSearch, type SearchableHadith } from '../search'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [records, setRecords] = useState<SearchableHadith[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const query = params.get('q') ?? ''
  const deferredQuery = useDeferredValue(query.trim())

  useEffect(() => {
    if (DATA_MODE !== 'real') { setState('ready'); return }
    let active = true
    Promise.all([hadithRepository.getAllHadith(), hadithRepository.getCollection(DEFAULT_COLLECTION), loadAllTranslations('en', DEFAULT_COLLECTION).catch(() => null)])
      .then(([all, collection, english]) => {
        if (!active) return
        const chapterNames = new Map(collection.chapters.map((chapter) => [chapter.id, chapter.title]))
        setRecords(all.map((record) => ({ ...record, chapterTitle: chapterNames.get(record.chapterId) ?? '', translationText: english?.translations[record.id]?.text ?? '' })))
        setState('ready')
      })
      .catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [])

  const search = useMemo(() => records.length ? createHadithSearch(records) : null, [records])
  const byId = useMemo(() => new Map(records.map((record) => [record.id, record])), [records])
  const results = useMemo(() => {
    if (!search || deferredQuery.length < 2) return []
    return search.search(deferredQuery, { prefix: true }).slice(0, 40).map((result) => byId.get(result.id)).filter((record): record is SearchableHadith => Boolean(record))
  }, [byId, deferredQuery, search])

  return (
    <main className="content-page narrow page-with-nav search-page">
      <header className="page-heading compact"><p className="eyebrow">Find a passage</p><h1>Search Riyad</h1><p>Search the Arabic text, English translation, hadith numbers, and chapter titles.</p></header>
      <label className="search-box"><Search size={21} aria-hidden="true" /><span className="sr-only">Search hadith</span><input type="search" value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })} placeholder="A word, number, or chapter…" autoComplete="off" /></label>
      <div className="search-results" aria-live="polite">
        {state === 'loading' && <p className="result-count">Preparing the search index…</p>}
        {state === 'error' && <p className="notice error">Search data could not be loaded. Please try again online.</p>}
        {state === 'ready' && deferredQuery.length < 2 && <p className="result-count">Enter at least two characters to search {records.length.toLocaleString()} hadith.</p>}
        {state === 'ready' && deferredQuery.length >= 2 && <p className="result-count">{results.length === 40 ? 'First 40 matches' : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`} for “{deferredQuery}”</p>}
        {results.map((record) => <Link className="search-result" key={record.id} to={`/collection/${record.collectionId}/chapter/${record.chapterId}#${record.id}`}><span className="result-topline">Hadith {record.number} · Chapter {record.chapterId}<ArrowUpRight size={18} /></span><p dir="rtl" lang="ar">{record.arabic.length > 180 ? `${record.arabic.slice(0, 180)}…` : record.arabic}</p>{record.translationText && <span className="result-translation">{record.translationText.length > 180 ? `${record.translationText.slice(0, 180)}…` : record.translationText}</span>}<small>{record.chapterTitle?.replace(/^\d+\s*[-–—]\s*/, '')}</small></Link>)}
      </div>
    </main>
  )
}
