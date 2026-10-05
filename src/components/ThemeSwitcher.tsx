import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getSetting, setSetting } from '../data/db'
import { useI18n } from '../i18n'

type Theme = 'system' | 'light' | 'dark' | 'sepia'

export function ThemeSwitcher() {
  const { t } = useI18n()
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    getSetting<Theme>('theme', 'system').then(setTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const chooseTheme = (value: Theme) => {
    setTheme(value)
    void setSetting('theme', value)
  }

  return (
    <div className="theme-switcher" aria-label={t('Reading theme')}>
      <button aria-label={t('Light theme')} data-active={theme === 'light'} onClick={() => chooseTheme('light')}><Sun size={17} /></button>
      <button aria-label={t('Sepia theme')} data-active={theme === 'sepia'} onClick={() => chooseTheme('sepia')}>Aa</button>
      <button aria-label={t('Dark theme')} data-active={theme === 'dark'} onClick={() => chooseTheme('dark')}><Moon size={17} /></button>
    </div>
  )
}
