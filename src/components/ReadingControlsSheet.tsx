import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Sprout, Sun, X } from 'lucide-react'
import { getSetting, setSetting } from '../data/db'
import { APP_EVENTS, dispatchAppEvent } from '../core/appEvents'
import { useLocation } from 'react-router-dom'
import { useQuranSettings } from '../services/QuranSettings'
import { quranEditions } from '../../shared/quran-editions.mjs'
import { trackFlow } from '../services/AnalyticsContext'
import { useI18n } from '../i18n'

export type ReadingPreferences = {
  arabicSize: number
  translationSize: number
  showDiacritics: boolean
  theme: 'light' | 'dark'
}

const getDefaultArabicSize = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 721px)').matches ? 34 : 30

export function ReadingControlsSheet() {
  const { t, language } = useI18n()
  const isQuran=useLocation().pathname.startsWith('/quran')
  const {preferences:quran,update:changeQuran}=useQuranSettings()
  const [open, setOpen] = useState(false)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => ({ arabicSize: getDefaultArabicSize(), translationSize: 17, showDiacritics: true, theme: 'light' }))
  const close=()=>{trackFlow('flow.skipped','reading_settings');setOpen(false)}
  const complete=()=>trackFlow('flow.completed','reading_settings')
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    Promise.all([
      getSetting('arabicSizePx', getDefaultArabicSize()),
      getSetting('translationSizePx', 17).then((size) => Math.max(16, size)),
      getSetting('showDiacritics', true),
      getSetting<string>('theme', 'light'),
    ]).then(([arabicSize, translationSize, showDiacritics, theme]) => {
      const normalizedTranslationSize = Math.max(16, translationSize)
      const normalizedTheme = theme === 'light' ? 'light' : 'dark'
      setPreferences({ arabicSize, translationSize: normalizedTranslationSize, showDiacritics, theme: normalizedTheme })
      setPreferencesLoaded(true)
      if (normalizedTranslationSize !== translationSize) void setSetting('translationSizePx', normalizedTranslationSize)
      if (normalizedTheme !== theme) void setSetting('theme', normalizedTheme)
    })
    const show = () => {trackFlow('flow.started','reading_settings');setOpen(true)}
    window.addEventListener(APP_EVENTS.openReadingSettings, show)
    return () => window.removeEventListener(APP_EVENTS.openReadingSettings, show)
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.style.setProperty('--translation-size', `${preferences.translationSize}px`)
    document.documentElement.style.setProperty('--arabic-size', `${preferences.arabicSize}px`)
    window.dispatchEvent(new CustomEvent<ReadingPreferences>(APP_EVENTS.readingPreferencesChange, { detail: preferences }))
  }, [preferences, preferencesLoaded])

  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); return }
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
      requestAnimationFrame(() => returnFocusRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    dispatchAppEvent(APP_EVENTS.readingSettingsState, open)
  }, [open])

  const update = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    trackFlow('flow.completed','reading_settings')
    setPreferences((current) => ({ ...current, [key]: value }))
    const storageKey = key === 'arabicSize' ? 'arabicSizePx' : key === 'translationSize' ? 'translationSizePx' : key
    void setSetting(storageKey, value)
  }

  const reset = () => {
    complete()
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
      <button className="reading-sheet-backdrop" tabIndex={-1} aria-label={t('Dismiss reading settings')} onClick={close} />
      <section id="reading-settings-dialog" ref={dialogRef} className="reading-sheet" role="dialog" aria-modal="true" aria-labelledby="reading-settings-title">
        <header>
          <div><h2 id="reading-settings-title">{t('Reading settings')}</h2></div>
          <button ref={closeRef} className="icon-button" aria-label={t('Close reading settings')} onClick={close}><X /></button>
        </header>
        {isQuran&&<section className="quran-display-settings"><h3>{t('Quran reading')}</h3><label className="field-label">{t('Translation edition')}<select data-track="quran.translation" value={quran.edition} onChange={event=>{trackFlow('flow.completed','reading_settings');changeQuran({edition:event.target.value})}}>{['en','ur','bn'].map(code=><optgroup key={code} label={code==='en'?'English':code==='ur'?'اردو':'বাংলা'}>{quranEditions.filter(x=>x.language===code).map(edition=><option key={edition.key} value={edition.key}>{edition.title} · {edition.publisher}</option>)}</optgroup>)}</select></label><label className="consent-check"><input type="checkbox" checked={quran.showTranslation} onChange={event=>{trackFlow('flow.completed','reading_settings');changeQuran({showTranslation:event.target.checked})}}/><span>{t('Show translation')}</span></label><fieldset className="theme-options"><legend>{t('Arabic script')}</legend><div className="theme-buttons">{(['uthmani','indopak'] as const).map(script=><button data-track="quran.script" key={script} className="theme-choice" aria-pressed={quran.script===script} onClick={()=>{complete();changeQuran({script})}}>{t(script==='uthmani'?'Uthmani':'Indo-Pak')}</button>)}</div></fieldset><fieldset className="theme-options"><legend>{t('Reading layout')}</legend><div className="theme-buttons">{(['verses','mushaf'] as const).map(mode=><button data-track="quran.view" className="theme-choice" key={mode} aria-pressed={quran.mode===mode} onClick={()=>{complete();changeQuran({mode})}}>{t(mode==='verses'?'Verses':'Mushaf')}</button>)}</div></fieldset><p className="feature-footnote">{t('Each script uses its matching source text. Translation wording and notes are preserved.')}</p></section>}
        <label className="range-setting"><span><strong>{t('Arabic size')}</strong><output>{preferences.arabicSize}px</output></span><input type="range" min="20" max="56" value={preferences.arabicSize} onChange={(event) => update('arabicSize', Number(event.target.value))} /></label>
        <label className="range-setting"><span><strong>{t('Translation size')}</strong><output>{preferences.translationSize}px</output></span><input type="range" min="16" max="28" value={preferences.translationSize} onChange={(event) => update('translationSize', Number(event.target.value))} /></label>
        <fieldset className="theme-options"><legend>{t('Theme')}</legend><div className="theme-buttons">{([
          ['light', 'Day', Sun], ['dark', 'Night', Sprout],
        ] as const).map(([theme, label, Icon]) => <button type="button" key={theme} className="theme-choice" aria-label={t(label)} title={t(label)} aria-pressed={preferences.theme === theme} onClick={() => update('theme', theme)}><Icon size={20} aria-hidden="true" /><span>{t(label)}</span></button>)}</div></fieldset>
        <label className="switch-setting"><span><strong>{t('Diacritics')}</strong><small>{t('Show Arabic tashkeel where provided.')}</small></span><span className="switch-control"><input role="switch" aria-checked={preferences.showDiacritics} type="checkbox" checked={preferences.showDiacritics} onChange={(event) => update('showDiacritics', event.target.checked)} /><span className="switch-track" aria-hidden="true" /></span></label>
        <div className="reading-preview" aria-label={t('Live reading preview')}><p dir="rtl" lang="ar" style={{ fontSize: preferences.arabicSize }}>نص عربي للمعاينة</p><small className="preview-label">{t('Translation preview')}</small><p lang={language} dir={language === 'ur' || language === 'ar' ? 'rtl' : 'ltr'} style={{ fontSize: preferences.translationSize }}>{t('A gentle moment for thoughtful reading.')}</p></div>
        <button className="reset-button" onClick={reset}><RotateCcw size={17} /> {t('Reset')}</button>
      </section>
    </>
  )
}
