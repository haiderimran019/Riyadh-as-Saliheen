import { CAUTION_TEXT } from '../components/SiteFooter'

export function AboutPage() {
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><p className="eyebrow">About</p><h1>A quiet, private reader</h1><p>This free app has no ads, analytics, accounts, cookies, or personal names. Reading preferences and saved items stay on your device.</p></header><section><h2>Important caution</h2><p>{CAUTION_TEXT}</p></section></main>
}
