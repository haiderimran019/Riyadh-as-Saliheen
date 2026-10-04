import { CAUTION_TEXT } from '../components/SiteFooter'

export function TermsPage() {
  return <main className="content-page narrow page-with-nav legal-page"><header className="page-heading compact"><p className="eyebrow">Terms</p><h1>Terms and disclaimer</h1></header><section><p>{CAUTION_TEXT}</p><h2>Licensing</h2><p>The application code is provided under the MIT License. Hadith content, translations, grades, and other source material are not covered by that licence and remain subject to their publishers’ terms.</p><h2>No warranty</h2><p>The app is provided without warranty. Verify important information with its credited source and consult a qualified scholar for religious guidance.</p></section></main>
}
