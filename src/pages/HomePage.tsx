import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hadithRepository } from '../data/HadithRepository'
import { SHOW_FEEDBACK } from '../config'

export function HomePage() {
  const [error, setError] = useState('')
  const [daily, setDaily] = useState<Awaited<ReturnType<typeof hadithRepository.getDailyHadith>>>()

  useEffect(() => {
    hadithRepository.getDailyHadith(new Date()).then(setDaily).catch((reason: Error) => setError(reason.message))
  }, [])

  return (
    <main className="welcome page-with-nav">
      <p className="eyebrow">Private by design · Works offline</p>
      <h1>A quiet place to read and reflect.</h1>
      <p className="lede">Browse carefully sourced collections without accounts, ads, analytics, or tracking.</p>
      {error && <p className="notice error">{error}</p>}
      {daily && (
        <section className="daily-card" aria-labelledby="daily-title">
          <div>
            <span className="label">Hadith of the day</span>
            <h2 id="daily-title">Today’s reading</h2>
          </div>
          <p dir="rtl" lang="ar">{daily.arabic}</p>
          <footer>
            <span>{daily.collection} · no. {daily.number}</span>
            <span>Hadith text and grades: HadeethEnc.com</span>
            <span>{daily.grades.length > 0 ? daily.grades.map((grade) => `${grade.grade} · ${grade.grader}`).join('; ') : 'Grade not available'}</span>
            <Link to={`/collection/${daily.collectionId}/chapter/${daily.chapterId}#${daily.id}`}>Open reading</Link>
          </footer>
        </section>
      )}
      <Link className="continue-link" to="/library">Browse the library</Link>
      {SHOW_FEEDBACK && <Link className="home-feedback" to="/feedback">Send feedback</Link>}
    </main>
  )
}
