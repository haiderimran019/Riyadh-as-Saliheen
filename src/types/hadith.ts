export type DatasetMetadata = {
  sourceName: string
  sourceUrl: string
  contributor: string
  contributorRole: 'editor' | 'translator'
  license: string
  dateRetrieved: string
}

export type HadeethEncRecord = {
  id: string
  title: string
  hadeeth: string
  hadeeth_ar: string
  hadeeth_intro?: string
  attribution?: string
  grade?: string
  grade_ar?: string
  explanation?: string
  hints?: string[]
  words_meanings?: unknown[]
  categories?: string[]
  translations?: string[]
  [key: string]: unknown
}

export type Translation = { text: string; raw?: HadeethEncRecord }

export type HadithGrade = {
  grader: string
  grade: string
  note?: string
}

export type HadithReference = {
  collection: string
  number: string
}

export type HadithRecord = {
  id: string
  collection: string
  book: string
  chapter: string
  number: string
  arabic: string
  grades: HadithGrade[]
  narrator?: string
  references: HadithReference[]
  topics?: string[]
  title?: string
  attribution?: string
  hadeethEnc?: HadeethEncRecord
}

export type HadeethCategory = { id: string; title: string; hadeeths_count: string; parent_id: string | null }

export type ChapterIndex = {
  id: string
  title: string
  file: string
  count: number
}

export type CollectionIndex = {
  id: string
  title: string
  description: string
  languages: string[]
  metadata: DatasetMetadata
  chapters: ChapterIndex[]
  categories?: HadeethCategory[]
  roots?: string[]
  languageCounts?: Record<string, number>
  languageNames?: Record<string, string>
  allFile?: string
}

export type ArabicChapterDataset = {
  metadata: DatasetMetadata
  records: HadithRecord[]
}

export type TranslationChapterDataset = {
  metadata: DatasetMetadata
  translations: Record<string, Translation>
}

export type CollectionsManifest = {
  metadata: DatasetMetadata
  collections: Array<Pick<CollectionIndex, 'id' | 'title' | 'description'> & { index: string }>
}

export type SourceCredit = {
  collection: string
  kind: 'arabic' | 'translation'
  language?: string
  metadata: DatasetMetadata
}

export type SourcesManifest = {
  metadata: DatasetMetadata
  sources: SourceCredit[]
}
