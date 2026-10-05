import { Link } from 'react-router-dom'
import type { ChapterIndex, HadeethCategory } from '../types/hadith'
import { useI18n } from '../i18n'

type Props = { collectionId: string; categories: HadeethCategory[]; chapters: ChapterIndex[]; roots: string[] }

export function TopicTree({ collectionId, categories, chapters, roots }: Props) {
  const { t } = useI18n()
  const children = new Map<string, HadeethCategory[]>()
  for (const category of categories) {
    const parent = category.parent_id ?? 'root'
    children.set(parent, [...(children.get(parent) ?? []), category])
  }
  const chapterIds = new Set(chapters.map((chapter) => chapter.id))

  const renderBranch = (category: HadeethCategory) => {
    const nested = children.get(category.id) ?? []
    const label = <span className="topic-label">{category.title}<span>{category.hadeeths_count}</span></span>
    if (nested.length === 0) return <li key={category.id}>{chapterIds.has(category.id) ? <Link to={`/collection/${collectionId}/chapter/${category.id}`}>{category.title}<span>{category.hadeeths_count}</span></Link> : label}</li>
    return <li key={category.id}><details><summary>{label}</summary>{chapterIds.has(category.id) && <Link className="topic-open" to={`/collection/${collectionId}/chapter/${category.id}`}>{t('Read this topic')}</Link>}<ul>{nested.map(renderBranch)}</ul></details></li>
  }

  return <ul className="topic-tree">{roots.map((id) => categories.find((category) => category.id === id)).filter((category): category is HadeethCategory => Boolean(category)).map(renderBranch)}</ul>
}
