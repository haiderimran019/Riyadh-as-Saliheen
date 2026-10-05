import { useEffect, useState } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type Bookmark, type BookmarkFolder } from '../data/db'

export function SavedPage() {
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
      setFolderMessage('Enter a name for the folder.')
      return
    }
    if (folders.some((folder) => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setFolderMessage('A folder with that name already exists.')
      return
    }
    try {
      await db.folders.add({ id: crypto.randomUUID(), name, createdAt: Date.now() })
      setFolderName('')
      setFolderMessage(`Folder “${name}” added.`)
      await refresh()
    } catch {
      setFolderMessage('Could not save the folder on this device. Please try again.')
    }
  }

  const removeFolder = async (folder: BookmarkFolder) => {
    try {
      await db.transaction('rw', db.folders, db.bookmarks, async () => {
        await db.bookmarks.where('folderId').equals(folder.id).modify({ folderId: undefined })
        await db.folders.delete(folder.id)
      })
      if (activeFolder === folder.id) setActiveFolder('all')
      setFolderMessage(`Folder “${folder.name}” removed. Its bookmarks are still saved under All.`)
      await refresh()
    } catch {
      setFolderMessage('Could not remove that folder. Please try again.')
    }
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
      <p className="folder-message" aria-live="polite">{folderMessage}</p>
      <div className="folder-tabs" aria-label="Bookmark folders">
        <button data-active={activeFolder === 'all'} onClick={() => setActiveFolder('all')}>All</button>
        {folders.map((folder) => <span className="folder-tab" key={folder.id}>
          <button data-active={activeFolder === folder.id} onClick={() => setActiveFolder(folder.id)}>{folder.name}</button>
          <button className="folder-delete" aria-label={`Remove folder ${folder.name}`} title="Remove folder; keep saved items" onClick={() => void removeFolder(folder)}><Trash2 size={15} /></button>
        </span>)}
      </div>
      <div className="saved-list">
        {visible.length === 0 && <p className="empty-state">No saved hadith here yet. Use the bookmark action while reading to add one.</p>}
        {visible.map((bookmark) => (
          <article className="saved-row" key={bookmark.hadithId}>
            <Link className="saved-reference" to={`/collection/${bookmark.collectionId}/chapter/${bookmark.chapterId}#${bookmark.hadithId}`}><strong>Hadith {bookmark.hadithId.split('-')[0]}</strong><small>Chapter {bookmark.chapterId} · Open reading</small></Link>
            <button aria-label={`Remove saved reading ${bookmark.hadithId}`} onClick={async () => { await db.bookmarks.delete(bookmark.hadithId); await refresh() }}><Trash2 size={17} /></button>
          </article>
        ))}
      </div>
    </main>
  )
}
