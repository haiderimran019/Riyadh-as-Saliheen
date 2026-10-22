import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION } from '../config'
import { hadithRepository } from '../data/HadithRepository'
import { loadAllTranslations } from '../data/loader'
import { createHadithSearch, type SearchableHadith } from '../search'
import { useI18n } from '../i18n'
import { getChapterTitle } from '../utils/chapterTitle'
import { stripArabicDiacritics } from '../utils/arabicText'
import { useShowDiacritics } from '../hooks/useShowDiacritics'
import type { DatasetMetadata } from '../types/hadith'

export function SearchPage() {
  const { language, t } = useI18n()
  const showDiacritics = useShowDiacritics()
  const [params, setParams] = useSearchParams()
  const [recordDataset, setRecordDataset] = useState<{ language: string; records: SearchableHadith[]; translationMetadata: DatasetMetadata | null } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const records = recordDataset?.language === language ? recordDataset.records : []
  const translationMetadata = recordDataset?.language === language ? recordDataset.translationMetadata : null
  const query = params.get('q') ?? ''
  const deferredQuery = useDeferredValue(query.trim())

  useEffect(() => {
    if (DATA_MODE !== 'real') { setState('ready'); return }
    let active = true
    setState('loading')
    Promise.all([hadithRepository.getAllHadith(), hadithRepository.getCollection(DEFAULT_COLLECTION), loadAllTranslations(language, DEFAULT_COLLECTION).catch(() => null)])
      .then(([all, collection, localized]) => {
        if (!active) return
        const chapterNames = new Map(collection.chapters.map((chapter) => [chapter.id, getChapterTitle(chapter, language)]))
        setRecordDataset({ language, translationMetadata: localized?.metadata ?? null, records: all.map((record) => ({ ...record, chapterTitle: chapterNames.get(record.chapterId) ?? '', translationText: localized?.translations[record.id]?.text ?? '' })) })
        setState('ready')
      })
      .catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [language])

  const search = useMemo(() => records.length ? createHadithSearch(records) : null, [records])
  const byId = useMemo(() => new Map(records.map((record) => [record.id, record])), [records])
  const results = useMemo(() => {
    if (!search || deferredQuery.length < 2) return []
    return search.search(deferredQuery, { prefix: true }).slice(0, 40).map((result) => byId.get(result.id)).filter((record): record is SearchableHadith => Boolean(record))
  }, [byId, deferredQuery, search])

  return (
    <main className="content-page narrow page-with-nav search-page">
      <header className="page-heading compact"><h1>{t('Your search starts here.')}</h1><p>{t(language === 'ur' ? 'Search the Arabic text, available Urdu translations, hadith numbers, and chapter titles.' : 'Search the Arabic text, English translation, hadith numbers, and chapter titles.')}</p></header>
      <label className="search-box"><Search size={21} aria-hidden="true" /><span className="sr-only">{t('Search hadith')}</span><input type="search" value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })} placeholder={t('A word, number, or chapter…')} autoComplete="off" /></label>
      {!query && <div className="search-suggestions"><span>{t('Try a topic')}</span>{['Patience', 'Intentions', 'Kindness', 'Knowledge'].map((term) => <button key={term} onClick={() => setParams({ q: language === 'ur' ? t(term) : term.toLowerCase() }, { replace: true })}>{t(term)}</button>)}</div>}
      <div className="search-results" aria-live="polite">
        {state === 'loading' && <p className="result-count">{t('Preparing the search index…')}</p>}
        {state === 'error' && <p className="notice error">{t('Search data could not be loaded. Please try again online.')}</p>}
        {state === 'ready' && deferredQuery.length < 2 && <p className="result-count">{t('Enter at least two characters to search')} {records.length.toLocaleString()} {t('hadith')}.</p>}
        {state === 'ready' && deferredQuery.length >= 2 && <p className="result-count">{results.length === 40 ? t('First 40 matches') : `${results.length} ${t(results.length === 1 ? 'match' : 'matches')}`} {t('for')} “{deferredQuery}”</p>}
        {results.map((record) => {
          const arabic = showDiacritics ? record.arabic : stripArabicDiacritics(record.arabic)
          return <Link className="search-result" key={record.id} to={`/collection/${record.collectionId}/chapter/${record.chapterId}#${record.id}`}><span className="result-topline">{t('Hadith')} {record.number} · {t('Chapter')} {record.chapterId}<ArrowUpRight size={18} /></span><p dir="rtl" lang="ar">{arabic.length > 180 ? `${arabic.slice(0, 180)}…` : arabic}</p>{record.translationText && <span className="result-translation" lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'}>{language === 'ur' || record.translationText.length <= 180 ? record.translationText : `${record.translationText.slice(0, 180)}…`}</span>}{language === 'ur' && record.translationText && translationMetadata && <small className="result-source">{t('Translation source:')} <bdi dir="ltr">{translationMetadata.sourceName}{translationMetadata.version ? ` · ${translationMetadata.version}` : ''}</bdi></small>}<small>{record.chapterTitle?.replace(/^\d+\s*[-–—]\s*/, '')}</small></Link>
        })}
      </div>
    </main>
  )
}
