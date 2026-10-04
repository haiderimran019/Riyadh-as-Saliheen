import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CAUTION_TEXT } from '../components/SiteFooter'

export function SourcesPage() {
  return (
    <main className="content-page narrow page-with-nav">
      <Link className="back-link" to="/"><ArrowLeft size={17} /> Library</Link>
      <header className="page-heading">
        <p className="eyebrow">Transparency</p>
        <h1>Sources & credits</h1>
        <p>Every reading must keep its text, translation, and license attached to the source that supplied it.</p>
      </header>
      <section className="source-status"><h2>Riyad as-Salihin · Arabic</h2><p>Arabic text and original chapter order are sourced from IslamHouse.com / IslamEnc.com. The app preserves the source wording and reference numbering; only the page layout is reflowed for reading.</p></section>
      <section className="source-status"><h2>English translation</h2><p>The published English text is from IslamHouse.com / IslamEnc.com and is paired by the source's hadith reference. Some narrations may not have an English entry; those remain Arabic-only and are never filled with generated text.</p></section>
      <section className="source-status"><h2>Reuse terms</h2><p>The IslamHouse API Hub content policy permits use in apps and offline when text is preserved and the source is clearly credited. Code is MIT; the source content follows IslamHouse's content policy and is not covered by the code licence.</p></section>
      <section className="source-caution"><h2>Important caution</h2><p>{CAUTION_TEXT}</p></section>
    </main>
  )
}
