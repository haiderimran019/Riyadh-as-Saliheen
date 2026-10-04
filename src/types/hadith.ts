export type DatasetMetadata = {
  sourceName: string
  sourceUrl: string
  contributor: string
  contributorRole: 'editor' | 'translator' | 'placeholder'
  license: string
  dateRetrieved: string
  placeholder: boolean
}

export type Translation = { text: string }

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
  placeholder?: boolean
}

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
  placeholder: boolean
  metadata: DatasetMetadata
  chapters: ChapterIndex[]
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
  collections: Array<Pick<CollectionIndex, 'id' | 'title' | 'description' | 'placeholder'> & { index: string }>
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
