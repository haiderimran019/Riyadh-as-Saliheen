import { useEffect, useMemo, useState } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type Bookmark, type BookmarkFolder } from '../data/db'
import { loadAllHadith } from '../data/loader'
import type { SearchableHadith } from '../search'

export function SavedPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [records, setRecords] = useState<SearchableHadith[]>([])
  const [folderName, setFolderName] = useState('')
  const [activeFolder, setActiveFolder] = useState('all')
  const recordById = useMemo(() => new Map(records.map((record) => [record.id, record])), [records])

  const refresh = async () => {
    const [nextBookmarks, nextFolders] = await Promise.all([
      db.bookmarks.orderBy('createdAt').reverse().toArray(),
      db.folders.orderBy('createdAt').toArray(),
    ])
    setBookmarks(nextBookmarks)
    setFolders(nextFolders)
  }

  useEffect(() => {
    Promise.all([refresh(), loadAllHadith().then(setRecords)]).catch(console.error)
  }, [])

  const addFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = folderName.trim()
    if (!name) return
    await db.folders.add({ id: crypto.randomUUID(), name, createdAt: Date.now() })
    setFolderName('')
    await refresh()
  }

  const visible = bookmarks.filter((bookmark) => activeFolder === 'all' || bookmark.folderId === activeFolder)

  return (
    <main className="content-page narrow page-with-nav">
      <header className="page-heading compact">
        <p className="eyebrow">Stored only on this device</p>
        <h1>Saved</h1>
        <p>Bookmarks, folders, and reading progress never leave your browser.</p>
      </header>
      <form className="folder-form" onSubmit={addFolder}>
        <input aria-label="New folder name" value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="New folder name" />
        <button type="submit"><FolderPlus size={17} /> Add folder</button>
      </form>
      <div className="folder-tabs" aria-label="Bookmark folders">
        <button data-active={activeFolder === 'all'} onClick={() => setActiveFolder('all')}>All</button>
        {folders.map((folder) => <button data-active={activeFolder === folder.id} key={folder.id} onClick={() => setActiveFolder(folder.id)}>{folder.name}</button>)}
      </div>
      <div className="saved-list">
        {visible.length === 0 && <p className="empty-state">No bookmarks here yet.</p>}
        {visible.map((bookmark) => {
          const record = recordById.get(bookmark.hadithId)
          if (!record) return null
          return (
            <article className="saved-row" key={bookmark.hadithId}>
              <Link to={`/collection/${bookmark.collectionId}/chapter/${bookmark.chapterId}#${bookmark.hadithId}`}>
                <span className="label">Hadith {record.number}</span>
                <p dir="rtl" lang="ar">{record.arabic}</p>
              </Link>
              <button aria-label={`Remove bookmark ${record.number}`} onClick={async () => { await db.bookmarks.delete(bookmark.hadithId); await refresh() }}><Trash2 size={17} /></button>
            </article>
          )
        })}
      </div>
    </main>
  )
}
