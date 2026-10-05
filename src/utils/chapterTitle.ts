import type { ChapterIndex } from '../types/hadith'

const genericTitle = /^chapter\s+\d+$/iu
const chapterPrefix = /^\s*[\d\u0660-\u0669]+\s*[-–—ـ]+\s*/u

export function getChapterTitle(chapter: ChapterIndex, language: string) {
  const englishTitle = chapter.title?.trim()
  const sourceTitle = chapter.titleArabic?.trim()
  const title = language === 'ur' || !englishTitle || genericTitle.test(englishTitle)
    ? sourceTitle || englishTitle || `باب ${chapter.id}`
    : englishTitle
  return title.replace(chapterPrefix, '').trim()
}
