import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Sprout, Sun, X } from 'lucide-react'
import { getSetting, setSetting } from '../data/db'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { useI18n } from '../i18n'

export type ReadingPreferences = {
  arabicSize: number
  translationSize: number
  showDiacritics: boolean
  theme: 'light' | 'dark'
}

const getDefaultArabicSize = () => window.matchMedia('(min-width: 721px)').matches ? 34 : 30

export function ReadingControlsSheet() {
  const { t, language } = useI18n()
  const [open, setOpen] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => ({ arabicSize: getDefaultArabicSize(), translationSize: 17, showDiacritics: true, theme: 'dark' }))
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    Promise.all([
      getSetting('arabicSizePx', getDefaultArabicSize()),
      getSetting('translationSizePx', 17).then((size) => Math.max(16, size)),
      getSetting('showDiacritics', true),
      getSetting<string>('theme', 'dark'),
    ]).then(([arabicSize, translationSize, showDiacritics, theme]) => {
      const normalizedTranslationSize = Math.max(16, translationSize)
      const normalizedTheme = theme === 'light' ? 'light' : 'dark'
      setPreferences({ arabicSize, translationSize: normalizedTranslationSize, showDiacritics, theme: normalizedTheme })
      setPreferencesLoaded(true)
      if (normalizedTranslationSize !== translationSize) void setSetting('translationSizePx', normalizedTranslationSize)
      if (normalizedTheme !== theme) void setSetting('theme', normalizedTheme)
    })
    const show = () => setOpen(true)
    window.addEventListener(APP_EVENTS.openReadingSettings, show)
    return () => window.removeEventListener(APP_EVENTS.openReadingSettings, show)
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.style.setProperty('--translation-size', `${preferences.translationSize}px`)
    window.dispatchEvent(new CustomEvent<ReadingPreferences>(APP_EVENTS.readingPreferencesChange, { detail: preferences }))
  }, [preferences, preferencesLoaded])

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); return }
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]') ?? [])].filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeys)
    return () => {
      document.removeEventListener('keydown', handleKeys)
      returnFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    dispatchAppEvent(APP_EVENTS.readingSettingsState, open)
  }, [open])

  const update = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }))
    const storageKey = key === 'arabicSize' ? 'arabicSizePx' : key === 'translationSize' ? 'translationSizePx' : key
    void setSetting(storageKey, value)
  }

  const reset = () => {
    const defaults: ReadingPreferences = { arabicSize: getDefaultArabicSize(), translationSize: 17, showDiacritics: true, theme: 'dark' }
    setPreferences(defaults)
    void Promise.all([
      setSetting('arabicSizePx', defaults.arabicSize), setSetting('translationSizePx', defaults.translationSize),
      setSetting('showDiacritics', defaults.showDiacritics), setSetting('theme', defaults.theme),
    ])
  }

  if (!open) return null

  return (
    <>
      <button className="reading-sheet-backdrop" aria-label={t('Close reading settings')} onClick={() => setOpen(false)} />
      <section ref={dialogRef} className="reading-sheet" role="dialog" aria-modal="true" aria-labelledby="reading-settings-title">
        <header>
          <div><p className="eyebrow">{t('Display')}</p><h2 id="reading-settings-title">{t('Reading settings')}</h2></div>
          <button ref={closeRef} className="icon-button" aria-label={t('Close reading settings')} onClick={() => setOpen(false)}><X /></button>
        </header>
        <label className="range-setting"><span><strong>{t('Arabic size')}</strong><output>{preferences.arabicSize}px</output></span><input type="range" min="20" max="56" value={preferences.arabicSize} onChange={(event) => update('arabicSize', Number(event.target.value))} /></label>
        <label className="range-setting"><span><strong>{t('Translation size')}</strong><output>{preferences.translationSize}px</output></span><input type="range" min="16" max="28" value={preferences.translationSize} onChange={(event) => update('translationSize', Number(event.target.value))} /></label>
        <fieldset className="theme-options"><legend>{t('Theme')}</legend><div className="theme-buttons">{([
          ['dark', 'Green', Sprout], ['light', 'White', Sun],
        ] as const).map(([theme, label, Icon]) => <button type="button" key={theme} className="theme-choice" aria-label={t(label)} title={t(label)} aria-pressed={preferences.theme === theme} onClick={() => update('theme', theme)}><Icon size={20} aria-hidden="true" /><span>{t(label)}</span></button>)}</div></fieldset>
        <label className="switch-setting"><span><strong>{t('Diacritics')}</strong><small>{t('Show Arabic tashkeel where provided.')}</small></span><span className="switch-control"><input role="switch" aria-checked={preferences.showDiacritics} type="checkbox" checked={preferences.showDiacritics} onChange={(event) => update('showDiacritics', event.target.checked)} /><span className="switch-track" aria-hidden="true" /></span></label>
        <div className="reading-preview" aria-label={t('Live reading preview')}><p dir="rtl" lang="ar" style={{ fontSize: preferences.arabicSize }}>نص عربي للمعاينة</p><small className="preview-label">{t('Translation preview')}</small><p lang={language} dir={language === 'ur' ? 'rtl' : 'ltr'} style={{ fontSize: preferences.translationSize }}>{t('A gentle moment for thoughtful reading.')}</p></div>
        <button className="reset-button" onClick={reset}><RotateCcw size={17} /> {t('Reset')}</button>
      </section>
    </>
  )
}
