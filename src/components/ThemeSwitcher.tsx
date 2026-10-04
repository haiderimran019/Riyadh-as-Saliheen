import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark' | 'sepia'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="theme-switcher" aria-label="Reading theme">
      <button aria-label="Light theme" data-active={theme === 'light'} onClick={() => setTheme('light')}><Sun size={17} /></button>
      <button aria-label="Sepia theme" data-active={theme === 'sepia'} onClick={() => setTheme('sepia')}>Aa</button>
      <button aria-label="Dark theme" data-active={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={17} /></button>
    </div>
  )
}
