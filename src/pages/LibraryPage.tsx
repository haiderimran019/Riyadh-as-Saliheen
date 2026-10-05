import { useEffect, useState } from 'react'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, DEFAULT_COLLECTION } from '../config'
import { hadithRepository } from '../data/HadithRepository'
import type { CollectionIndex } from '../types/hadith'
import { useI18n } from '../i18n'
import { getChapterTitle } from '../utils/chapterTitle'

export function LibraryPage() {
  const { t, language } = useI18n()
  const [collection, setCollection] = useState<CollectionIndex | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (DATA_MODE !== 'real') return
    let active = true
    hadithRepository.getCollection(DEFAULT_COLLECTION)
      .then((value) => { if (active) setCollection(value) })
      .catch(() => { if (active) setError('The local collection data could not be loaded.') })
    return () => { active = false }
  }, [])

  const firstChapter = collection?.chapters[0]
  return (
    <main className="content-page page-with-nav library-page">
      <header className="page-heading compact">
        <p className="eyebrow">{t('One collection · read by chapter')}</p>
        <h1>{t('The library')}</h1>
        <p>{t('Riyad as-Salihin, with its Arabic text and a published English translation.')}</p>
      </header>
      <section className="library-feature" aria-labelledby="riyad-title">
        <div className="library-feature-art" aria-hidden="true"><div className="library-cover-seal">رياض<br />الصالحين</div><small>RIYAD AS-SALIHIN</small></div>
        <div className="library-feature-copy">
          <span className="label">{t('The collection')}</span>
          <h2 id="riyad-title">{t('Riyad as-Salihin')}</h2>
          {collection ? (
            <>
              <p>{new Intl.NumberFormat('en-US').format(collection.chapters.length)} {t('Chapters')} · {new Intl.NumberFormat('en-US').format(collection.recordIds?.length ?? 0)} {t('hadith')} · {t('Arabic and English')}</p>
              <p className="data-status"><span aria-hidden="true" /> {t('Arabic and English reading text is available online.')}</p>
              <Link className="primary-action" to={firstChapter ? `/collection/${collection.id}/chapter/${firstChapter.id}` : `/collection/${collection.id}`}><BookOpen size={18} /> {t('Begin reading')} <ChevronRight size={17} /></Link>
              <Link className="text-action" to={`/collection/${collection.id}`}>{t('Browse all chapters')}</Link>
            </>
          ) : (
            <>
              <p>{DATA_MODE === 'placeholder' ? t('This preview contains no real hadith text yet.') : error || t('Opening the locally stored chapter index…')}</p>
              <p className="data-status"><span aria-hidden="true" /> {DATA_MODE === 'placeholder' ? t('Switch to the local real-data build to read.') : error ? t('Check the data import and try again.') : t('Loading the chapter list.')}</p>
              <Link className="primary-action" to="/sources">{t('Source status')} <ChevronRight size={17} /></Link>
            </>
          )}
        </div>
      </section>
      <p className="library-footnote">{language === 'ur' ? 'عربی متن اور انگریزی ترجمہ IslamHouse / IslamEnc سے ہیں اور اصل صورت میں دکھائے گئے ہیں۔ اردو ترجمہ فی الحال اس نسخے میں شامل نہیں۔' : t('Text and translation are provided by IslamHouse / IslamEnc and shown as published. Translation coverage is identified per narration.')}</p>
      {collection && <section className="library-contents" aria-labelledby="library-contents-title">
        <header className="library-contents-heading"><div><p className="eyebrow">{t('Begin anywhere')}</p><h2 id="library-contents-title">{t('Open a chapter')}</h2></div><Link to={`/collection/${collection.id}`}>{t('All chapters')} <ChevronRight size={17} /></Link></header>
        <div className="library-chapter-preview">{collection.chapters.slice(0, 3).map((chapter) => <Link className="chapter-row" key={chapter.id} to={`/collection/${collection.id}/chapter/${chapter.id}`}><span className="chapter-index">{chapter.id.padStart(2, '0')}</span><span><strong dir="auto">{getChapterTitle(chapter, language)}</strong><small>{chapter.count.toLocaleString('en-US')} {t('hadith')}</small></span><ChevronRight aria-hidden="true" /></Link>)}</div>
      </section>}
    </main>
  )
}
