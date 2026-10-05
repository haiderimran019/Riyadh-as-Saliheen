import { useEffect, useState } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type Bookmark, type BookmarkFolder } from '../data/db'
import { useI18n } from '../i18n'

export function SavedPage() {
  const { t } = useI18n()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [folderName, setFolderName] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const [folderMessage, setFolderMessage] = useState('')

  const refresh = async () => {
    const [nextBookmarks, nextFolders] = await Promise.all([
      db.bookmarks.orderBy('createdAt').reverse().toArray(),
      db.folders.orderBy('createdAt').toArray(),
    ])
    setBookmarks(nextBookmarks)
    setFolders(nextFolders)
  }

  useEffect(() => {
    void refresh()
  }, [])

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
      await db.transaction('rw', db.folders, db.bookmarks, async () => {
        await db.bookmarks.where('folderId').equals(folder.id).modify({ folderId: undefined })
        await db.folders.delete(folder.id)
      })
      if (activeFolder === folder.id) setActiveFolder('all')
      setFolderMessage(`${t('Folder removed. Its bookmarks are still saved under All.')} “${folder.name}”`)
      await refresh()
    } catch {
      setFolderMessage(t('Could not remove that folder. Please try again.'))
    }
  }

  const visible = bookmarks.filter((bookmark) => activeFolder === 'all' || bookmark.folderId === activeFolder)

  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">{t('Stored only on this device')}</p>
        <h1>{t('Saved')}</h1>
        <p>{t('Bookmarks, folders, and reading progress never leave your browser.')}</p>
      </header>
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
        {visible.length === 0 && <p className="empty-state">{t('No saved hadith here yet. Use the bookmark action while reading to add one.')}</p>}
        {visible.map((bookmark) => (
          <article className="saved-row" key={bookmark.hadithId}>
            <Link className="saved-reference" to={`/collection/${bookmark.collectionId}/chapter/${bookmark.chapterId}#${bookmark.hadithId}`}><strong>{t('Hadith')} {bookmark.hadithId.split('-')[0]}</strong><small>{t('Chapter')} {bookmark.chapterId} · {t('Open reading')}</small></Link>
            <button aria-label={`${t('Remove saved reading')} ${bookmark.hadithId}`} onClick={async () => { await db.bookmarks.delete(bookmark.hadithId); await refresh() }}><Trash2 size={17} /></button>
          </article>
        ))}
      </div>
    </main>
  )
}
