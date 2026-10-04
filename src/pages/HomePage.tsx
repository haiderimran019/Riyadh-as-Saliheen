import { ArrowDownRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DATA_MODE, SHOW_FEEDBACK } from '../config'

export function HomePage() {
  return (
    <main className="welcome page-with-nav riyad-home">
      <section className="hero-panel" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">رياض الصالحين <span>·</span> The gardens of the righteous</p>
          <h1 id="home-title">Riyad as-Salihin, one hadith at a time.</h1>
          <p className="lede">Read the Arabic text with an English translation, chapter by chapter, in a quiet reader built for this collection.</p>
          <div className="hero-actions">
            <Link className="primary-action" to={DATA_MODE === 'real' ? '/collection/riyad-as-salihin/chapter/1' : '/library'}><BookOpen size={18} /> Read the collection <ArrowDownRight size={17} /></Link>
            <Link className="text-action" to="/sources">About the text and sources</Link>
          </div>
        </div>
        <div className="hero-seal" aria-hidden="true"><span>رياض</span><i>الصالحين</i></div>
      </section>
      <div className="home-bottomline"><span>No accounts. No ads. No tracking.</span>{SHOW_FEEDBACK && <Link className="home-feedback" to="/feedback">Send feedback</Link>}</div>
    </main>
  )
}
