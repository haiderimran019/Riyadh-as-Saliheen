import { useEffect, useState } from 'react'
import { ArrowRight, Bookmark as BookmarkIcon, FolderPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type Bookmark, type BookmarkFolder, type QuranBookmark } from '../data/db'
import { useI18n } from '../i18n'
import { loadHadithRecord } from '../data/loader'
import { quranSurah } from '../services/reading'
import { hadithReadingUrl, quranReadingUrl } from '../services/readingPlace'
import { ResumeReading } from '../components/ResumeReading'
import type { QuranSura } from '../ssr/BootData'
import type { HadithRecord } from '../types/hadith'

export function SavedPage() {
  const { t } = useI18n()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [folderName, setFolderName] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const [passages, setPassages] = useState<Record<string, HadithRecord>>({})
  const [folderMessage, setFolderMessage] = useState('')
  const [quranBookmarks, setQuranBookmarks] = useState<QuranBookmark[]>([])
  const [ayahs, setAyahs] = useState<Record<string, QuranSura['result'][number]>>({})
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const [nextBookmarks, nextFolders, nextQuran] = await Promise.all([
      db.bookmarks.orderBy('createdAt').reverse().toArray(),
      db.folders.orderBy('createdAt').toArray(),
      db.quranBookmarks.orderBy('createdAt').reverse().toArray(),
    ])
    setBookmarks(nextBookmarks)
    setFolders(nextFolders)
    setQuranBookmarks(nextQuran)
    setLoading(false)
  }

  useEffect(() => {
    void refresh().catch(() => { setLoading(false); setFolderMessage(t('Could not load saved passages on this device. Please try again.')) })
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all(bookmarks.map(async (item) => {
      const dataset = await loadHadithRecord(item.collectionId, item.hadithId).catch(() => null)
      return dataset?.record ? [item.hadithId, dataset.record] as const : null
    })).then((items) => { if (active) setPassages(Object.fromEntries(items.filter((item) => item !== null))) })
    return () => { active = false }
  }, [bookmarks])


  useEffect(() => {
    let active = true
    const ids = [...new Set(quranBookmarks.map(item => item.surah))]
    void Promise.all(ids.map(id => quranSurah(id).catch(() => null))).then(datasets => {
      if (active) setAyahs(Object.fromEntries(datasets.flatMap(dataset => dataset?.result.map(ayah => [`${ayah.sura}:${ayah.aya}`, ayah]) || [])))
    })
    return () => { active = false }
  }, [quranBookmarks])

  const addFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = folderName.trim()
    if (!name) {
      setFolderMessage(t('Folder name is required.'))
      return
    }
    if (folders.some((folder) => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setFolderMessage(t('A folder with that name already exists.'))
      return
    }
    try {
      await db.folders.add({ id: crypto.randomUUID(), name, createdAt: Date.now() })
      setFolderName('')
      setFolderMessage(`${t('Folder added.')} “${name}”`)
      await refresh()
    } catch {
      setFolderMessage(t('Could not save the folder on this device. Please try again.'))
    }
  }

  const removeFolder = async (folder: BookmarkFolder) => {
    try {
      await db.transaction('rw', db.folders, db.bookmarks, db.quranBookmarks, async () => {
        await db.bookmarks.where('folderId').equals(folder.id).modify({ folderId: undefined })
        await db.quranBookmarks.where('folderId').equals(folder.id).modify({ folderId: undefined })
        await db.folders.delete(folder.id)
      })
      if (activeFolder === folder.id) setActiveFolder('all')
      setFolderMessage(`${t('Folder removed. Its bookmarks are still saved under All.')} “${folder.name}”`)
      await refresh()
    } catch {
      setFolderMessage(t('Could not remove that folder. Please try again.'))
    }
  }

  const visible = [
    ...bookmarks.map(item => ({ kind: 'hadith' as const, key: item.hadithId, folderId: item.folderId, createdAt: item.createdAt, url: hadithReadingUrl({ ...item, updatedAt: item.createdAt }), title: `${t('Hadith')} ${passages[item.hadithId]?.number ?? item.hadithId.split('-')[0]}`, text: passages[item.hadithId]?.arabic, reference: `${t('Chapter')} ${item.chapterId}` })),
    ...quranBookmarks.map(item => ({ kind: 'quran' as const, key: item.id, folderId: item.folderId, createdAt: item.createdAt, url: quranReadingUrl(item.surah, item.ayah), title: `${t('Quran')} ${item.surah}:${item.ayah}`, text: ayahs[item.id]?.arabic_text, reference: `${t('Surah')} ${item.surah} · ${t('Ayah')} ${item.ayah}` })),
  ].filter(item => activeFolder === 'all' || item.folderId === activeFolder).sort((a, b) => b.createdAt - a.createdAt)

  const removeBookmark = async (kind: 'hadith' | 'quran', key: string) => {
    try {
      if (kind === 'hadith') await db.bookmarks.delete(key)
      else await db.quranBookmarks.delete(key)
      await refresh()
    } catch { setFolderMessage(t('Could not update saved passages. Please try again.')) }
  }
  const moveQuranBookmark = async (key: string, folderId: string) => {
    try { await db.quranBookmarks.update(key, { folderId: folderId || undefined }); await refresh() }
    catch { setFolderMessage(t('Could not update saved passages. Please try again.')) }
  }

  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">

        <h1>{t('Saved passages')}</h1>
        <p>{t('Keep the words you want to return to.')}</p>
      </header>
      <ResumeReading />
      <p className="saved-storage-note">{t('Bookmarks and reading places are stored on this device.')}</p>
      <form className="folder-form" onSubmit={addFolder}>
        <input aria-label={t('New folder name')} value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder={t('New folder name')} />
        <button type="submit"><FolderPlus size={17} /> {t('Add folder')}</button>
      </form>
      <p className="folder-message" aria-live="polite">{folderMessage}</p>
      <div className="folder-tabs" aria-label={t('Bookmark folders')}>
        <button data-active={activeFolder === 'all'} onClick={() => setActiveFolder('all')}>{t('All')}</button>
        {folders.map((folder) => <span className="folder-tab" key={folder.id}>
          <button data-active={activeFolder === folder.id} onClick={() => setActiveFolder(folder.id)}>{folder.name}</button>
          <button className="folder-delete" aria-label={`${t('Remove folder')} ${folder.name}`} title={t('Remove folder; keep saved items')} onClick={() => void removeFolder(folder)}><Trash2 size={15} /></button>
        </span>)}
      </div>
      <div className="saved-list">
        {loading && <p role="status">{t('Opening your saved passages…')}</p>}
        {!loading && visible.length === 0 && <div className="empty-state saved-empty"><BookmarkIcon size={34} strokeWidth={1.25} /><h2>{t('Your saved collection')}</h2><p>{t('Save an ayah or hadith while reading. Your bookmarks will appear here.')}</p><Link className="text-action" to="/library">{t('The collection')}<ArrowRight size={17} /></Link></div>}
        {visible.map(item => (
          <article className="saved-row" key={`${item.kind}:${item.key}`}>
            <Link className="saved-reference" to={item.url}><strong className="saved-kind"><BookmarkIcon size={17}/>{item.title}</strong>{item.text && <p className="saved-excerpt" lang="ar" dir="rtl">{item.text}</p>}<small>{item.reference} · {t('Open reading')}</small></Link>
            <div className="saved-row-actions"><button aria-label={`${t('Remove saved reading')} ${item.title}`} onClick={() => void removeBookmark(item.kind, item.key)}><Trash2 size={17}/></button>
            {item.kind === 'quran' && folders.length > 0 && <select aria-label={`${t('Folder')} ${item.title}`} value={item.folderId || ''} onChange={event => void moveQuranBookmark(item.key, event.target.value)}><option value="">{t('No folder')}</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>}</div>
          </article>
        ))}
      </div>
    </main>
  )
}
