import { useEffect, useRef, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { getSetting, setSetting } from '../data/db'

export type ReadingPreferences = {
  arabicSize: number
  translationSize: number
  showDiacritics: boolean
  theme: 'light' | 'dark' | 'sepia'
}

const getDefaultArabicSize = () => window.matchMedia('(min-width: 721px)').matches ? 34 : 30

export function ReadingControlsSheet() {
  const [open, setOpen] = useState(false)
  const [preferences, setPreferences] = useState<ReadingPreferences>({ arabicSize: 30, translationSize: 17, showDiacritics: true, theme: 'light' })
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    Promise.all([
      getSetting('arabicSizePx', getDefaultArabicSize()),
      getSetting('translationSizePx', 17),
      getSetting('showDiacritics', true),
      getSetting<ReadingPreferences['theme']>('theme', 'light'),
    ]).then(([arabicSize, translationSize, showDiacritics, theme]) => setPreferences({ arabicSize, translationSize, showDiacritics, theme }))
    const show = () => setOpen(true)
    window.addEventListener('open-reading-settings', show)
    return () => window.removeEventListener('open-reading-settings', show)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.style.setProperty('--translation-size', `${preferences.translationSize}px`)
    window.dispatchEvent(new CustomEvent<ReadingPreferences>('reading-preferences-change', { detail: preferences }))
  }, [preferences])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const update = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    const storageKey = key === 'arabicSize' ? 'arabicSizePx' : key === 'translationSize' ? 'translationSizePx' : key
    void setSetting(storageKey, value)
  }

  const reset = () => {
    const defaults: ReadingPreferences = { arabicSize: getDefaultArabicSize(), translationSize: 17, showDiacritics: true, theme: 'light' }
    setPreferences(defaults)
    void Promise.all([
      setSetting('arabicSizePx', defaults.arabicSize), setSetting('translationSizePx', defaults.translationSize),
      setSetting('showDiacritics', defaults.showDiacritics), setSetting('theme', defaults.theme),
    ])
  }

  if (!open) return null

  return (
    <>
      <button className="reading-sheet-backdrop" aria-label="Close reading settings" onClick={() => setOpen(false)} />
      <section className="reading-sheet" role="dialog" aria-modal="true" aria-labelledby="reading-settings-title">
        <header>
          <div><p className="eyebrow">Display</p><h2 id="reading-settings-title">Reading settings</h2></div>
          <button ref={closeRef} className="icon-button" aria-label="Close reading settings" onClick={() => setOpen(false)}><X /></button>
        </header>
        <label className="range-setting"><span><strong>Arabic size</strong><output>{preferences.arabicSize}px</output></span><input type="range" min="20" max="56" value={preferences.arabicSize} onChange={(event) => update('arabicSize', Number(event.target.value))} /></label>
        <label className="range-setting"><span><strong>Translation size</strong><output>{preferences.translationSize}px</output></span><input type="range" min="14" max="28" value={preferences.translationSize} onChange={(event) => update('translationSize', Number(event.target.value))} /></label>
        <fieldset className="theme-options"><legend>Theme</legend>{(['light', 'dark', 'sepia'] as const).map((theme) => <label key={theme}><input type="radio" name="reader-theme" checked={preferences.theme === theme} onChange={() => update('theme', theme)} /> {theme}</label>)}</fieldset>
        <label className="switch-setting"><span><strong>Diacritics</strong><small>Show Arabic tashkeel where provided.</small></span><input type="checkbox" checked={preferences.showDiacritics} onChange={(event) => update('showDiacritics', event.target.checked)} /></label>
        <div className="reading-preview" aria-label="Live reading preview"><p dir="rtl" lang="ar" style={{ fontSize: preferences.arabicSize }}>نص عربي للمعاينة</p><p style={{ fontSize: preferences.translationSize }}>Translation preview</p></div>
        <button className="reset-button" onClick={reset}><RotateCcw size={17} /> Reset</button>
      </section>
    </>
  )
}
