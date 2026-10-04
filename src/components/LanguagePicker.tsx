import { Globe2 } from 'lucide-react'

export function LanguagePicker() {
  return (
    <span className="header-language" aria-label="Reading language: Arabic">
      <Globe2 size={16} aria-hidden="true" />
      <span lang="ar" dir="rtl">العربية</span>
      <span className="language-name">Arabic</span>
    </span>
  )
}
