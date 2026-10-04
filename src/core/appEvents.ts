export const APP_EVENTS = {
  openReadingSettings: 'open-reading-settings',
  languageChange: 'app-language-change',
  readingPreferencesChange: 'reading-preferences-change',
  readingSettingsState: 'reading-settings-state',
} as const

export function dispatchAppEvent(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}
