import { useEffect, useState } from 'react'
import { ArrowUpRight, Bookmark, Check, Copy, Info, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db, type BookmarkFolder } from '../data/db'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'
import { shareHadithImage } from '../utils/shareImage'
import { SHOW_FEEDBACK } from '../config'
import { useI18n } from '../i18n'
import { stripArabicDiacritics } from '../utils/arabicText'

type Props = {
  hadith: HadithRecord
  translation?: Translation
  translationMetadata?: DatasetMetadata
  showDiacritics: boolean
  arabicSize: number
  collectionId: string
  chapterId: string
  displayNumber: string
  language: string
}

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali', hi: 'Hindi' }

export function HadithCard({ hadith, translation, translationMetadata, showDiacritics, arabicSize, collectionId, chapterId, displayNumber, language }: Props) {
  const { t } = useI18n()
  const [saved, setSaved] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<BookmarkFolder[]>([])
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const arabic = showDiacritics ? hadith.arabic : stripArabicDiacritics(hadith.arabic)
  const isMatchedUrdu = language === 'ur' && Boolean(translation?.raw)

  useEffect(() => {
    Promise.all([db.bookmarks.get(hadith.id), db.folders.orderBy('createdAt').toArray()]).then(([bookmark, values]) => {
      setSaved(Boolean(bookmark))
      setFolderId(bookmark?.folderId ?? '')
      setFolders(values)
    })
  }, [hadith.id])

  const toggleBookmark = async () => {
    setSaving(true); setSaveError('')
    try {
    if (saved) {
      await db.bookmarks.delete(hadith.id)
      setSaved(false)
      setFolderId('')
    } else {
      await db.bookmarks.put({ hadithId: hadith.id, collectionId, chapterId, createdAt: Date.now() })
      setSaved(true)
    }
    } catch { setSaveError(t('Could not save on this device. Please try again.')) }
    finally { setSaving(false) }
  }

  const moveBookmark = async (nextFolderId: string) => {
    const bookmark = await db.bookmarks.get(hadith.id)
    if (!bookmark) return
    await db.bookmarks.put({ ...bookmark, folderId: nextFolderId || undefined })
    setFolderId(nextFolderId)
  }

  const copyReading = async () => {
    try {
      const copiedArabic = isMatchedUrdu && translation?.raw ? translation.raw.hadeeth_ar : hadith.arabic
      const qualification = isMatchedUrdu ? `\n\n${t('This Urdu text translates HadeethEnc’s matching narration; additional wording in the Riyad edition may differ.')}` : ''
      const translationCredit = translation && translationMetadata ? `\n\n${t('Translation source:')} ${translationMetadata.sourceName}${translationMetadata.version ? ` · ${translationMetadata.version}` : ''}` : ''
      await navigator.clipboard.writeText(`${copiedArabic}${translation ? `\n\n${translation.text}` : ''}${qualification}${translationCredit}\n\nRiyad as-Salihin · Chapter ${hadith.chapter}, hadith ${displayNumber} · source reference ${hadith.number} · ${hadith.sourceName ?? 'IslamHouse.com / IslamEnc.com'}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch { setCopied(false) }
  }

  return (
    <article className="hadith-card" id={hadith.id}>
      <header className="hadith-meta">
        <div>
          <span className="hadith-number">{t('Hadith')} {displayNumber}</span>
          <p>{t('Reference:')} {hadith.number}</p>
        </div>
        <div className="hadith-quick-actions">
          <button type="button" data-track="hadith.bookmark" aria-label={saved ? `${t('Remove hadith from saved')} ${displayNumber}` : `${t('Save hadith')} ${displayNumber}`} aria-pressed={saved} disabled={saving} onClick={() => void toggleBookmark()}><Bookmark size={20} fill={saved ? 'currentColor' : 'none'} /></button>
          <button type="button" aria-label={copied ? t('Copied') : `${t('Copy')} ${t('Hadith')} ${displayNumber}`} onClick={() => void copyReading()}>{copied ? <Check size={19} /> : <Copy size={19} />}</button>
          <button type="button" aria-label={`${t('Share')} ${t('Hadith')} ${displayNumber}`} onClick={() => void shareHadithImage(hadith, translation, translationMetadata)}><Share2 size={19} /></button>
        </div>
      </header>

      <p className="arabic-text" dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}px` }}>{arabic}</p>

      {translation && translationMetadata && (
        <section className="translation-block" lang={language} dir={language === 'ur' ? 'rtl' : 'auto'}>
          <span className="translation-label">{isMatchedUrdu ? t('Urdu · matching narration') : <>{t(LANGUAGE_NAMES[language] ?? language.toUpperCase())} {t('translation')}</>}</span>
          <p>{translation.text}</p>
          {isMatchedUrdu && <small>{t('This Urdu text translates HadeethEnc’s matching narration; additional wording in the Riyad edition may differ.')}</small>}
          <details className="translation-about">
            <summary><Info size={16} /> {t('About this translation')}</summary>
            <div>
              <p><strong>{t('Language:')}</strong> {t(LANGUAGE_NAMES[language] ?? language.toUpperCase())}</p>
              <p><strong>{t('Translation source:')}</strong> <bdi dir="auto">{translationMetadata.sourceName}{translationMetadata.version ? ` · ${translationMetadata.version}` : ''}</bdi></p>
              {isMatchedUrdu && translation.raw?.hadeeth_ar && <details>
                <summary>{t('Arabic wording for this translation')}</summary>
                <p className="arabic-text" lang="ar" dir="rtl" style={{ fontSize: `${arabicSize}px`, padding: '12px 0' }}>{showDiacritics ? translation.raw.hadeeth_ar : stripArabicDiacritics(translation.raw.hadeeth_ar)}</p>
              </details>}
              <p>{t('Not reviewed by this app’s team.')}</p>
              <p><Link to="/sources">{t('Sources')}</Link>{SHOW_FEEDBACK && <> · <Link to={`/feedback?type=mistake&hadith=${encodeURIComponent(hadith.id)}`}>{t('Report an error')}</Link></>}</p>
            </div>
          </details>
        </section>
      )}

      {language !== 'ar' && !translation && <p className="notice">{t(language === 'bn' ? 'Bengali hadith translation is not supplied by this edition. The Arabic text is complete.' : language === 'ur' ? 'Urdu translation is not available for this narration; the Arabic text above is from the source edition.' : 'English translation is not available for this narration; the Arabic text above is from the source edition.')}</p>}

      <p className="passage-status" role="status" aria-live="polite">{copied ? t('Copied with source attribution') : saved ? <Link to="/saved">{t('Saved to your passages')} <ArrowUpRight size={13}/></Link> : ''}</p>
      {saveError && <p className="bookmark-message" role="alert">{saveError}</p>}
      <footer className="hadith-footer">
        <div className="trust-summary"><span className="passage-source">{hadith.sourceName ?? 'IslamHouse / IslamEnc'}</span>
          {hadith.grades.map((grade) => <span className={`grade grade-${grade.grade.toLocaleLowerCase().replace(/[^a-z]+/g, '-')}`} key={`${grade.grader}-${grade.grade}`}>{grade.grade} <small>· per {grade.grader}</small></span>)}
          {hadith.grades.length === 0 && <span className="grade grade-unavailable">{t('Grade not supplied by this edition')}</span>}
        </div>
        <div className="save-controls">
          {saved && folders.length > 0 && (
            <select aria-label={`${t('Folder')} · ${t('Hadith')} ${displayNumber}`} value={folderId} onChange={(event) => moveBookmark(event.target.value)}>
              <option value="">{t('No folder')}</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          )}
        </div>
      </footer>
    </article>
  )
}
