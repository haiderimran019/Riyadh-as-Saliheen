import { AlertCircle } from 'lucide-react'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'

type Props = {
  hadith: HadithRecord
  translation?: Translation
  translationMetadata?: DatasetMetadata
  showDiacritics: boolean
  arabicSize: number
}

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g

export function stripArabicDiacritics(value: string) {
  return value.replace(ARABIC_DIACRITICS, '')
}

export function HadithCard({ hadith, translation, translationMetadata, showDiacritics, arabicSize }: Props) {
  const arabic = showDiacritics ? hadith.arabic : stripArabicDiacritics(hadith.arabic)
  return (
    <article className="hadith-card" id={hadith.id}>
      <header className="hadith-meta">
        <div>
          <span className="hadith-number">Hadith {hadith.number}</span>
          <p>{hadith.collection} · {hadith.book} · Chapter {hadith.chapter}</p>
        </div>
        {hadith.placeholder && <span className="placeholder-badge">Placeholder</span>}
      </header>

      <p className="arabic-text" dir="rtl" lang="ar" style={{ fontSize: `${arabicSize}rem` }}>{arabic}</p>

      {translation && translationMetadata && (
        <section className="translation-block" lang="en">
          <p>{translation.text}</p>
          <small>
            Translation credit: {translationMetadata.sourceName} · {translationMetadata.contributorRole}: {translationMetadata.contributor} · {translationMetadata.license}
          </small>
        </section>
      )}

      <footer className="hadith-footer">
        {hadith.grades.length > 0 ? hadith.grades.map((grade) => (
          <span className="grade neutral" key={`${grade.grader}-${grade.grade}`}>
            <AlertCircle size={15} /> {grade.grade} · graded by {grade.grader}
          </span>
        )) : (
          <span className="grade unavailable"><AlertCircle size={15} /> Grade not available</span>
        )}
        <span className="reference">Reference: {hadith.collection}, no. {hadith.number}</span>
      </footer>
    </article>
  )
}
