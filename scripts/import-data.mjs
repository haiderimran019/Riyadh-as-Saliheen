import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDirectory = join(root, 'scripts', 'source-data')
const outputDirectory = join(root, 'public', 'data')
const sourceFiles = ['arabic/nawawi-placeholder.json']
const translationFiles = ['translations/en/nawawi-placeholder.json']

function groupBy(values, getKey) {
  const groups = new Map()
  for (const value of values) {
    const key = getKey(value)
    groups.set(key, [...(groups.get(key) ?? []), value])
  }
  return groups
}

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

const translationSources = await Promise.all(
  translationFiles.map(async (file) => JSON.parse(await readFile(join(sourceDirectory, file), 'utf8'))),
)

const collections = []
for (const sourceFile of sourceFiles) {
  const source = JSON.parse(await readFile(join(sourceDirectory, sourceFile), 'utf8'))
  const collectionDirectory = join(outputDirectory, source.id)
  await mkdir(collectionDirectory, { recursive: true })

  const groups = groupBy(source.records, (record) => record.chapter)
  const chapters = []
  for (const [chapterId, records] of groups) {
    const file = `chapter-${chapterId}.json`
    const cleanRecords = records.map(({ chapterTitle: _chapterTitle, ...record }) => record)
    await writeFile(join(collectionDirectory, file), `${JSON.stringify({ metadata: source.metadata, records: cleanRecords }, null, 2)}\n`)
    chapters.push({
      id: chapterId,
      title: records[0].chapterTitle,
      file,
      count: records.length,
    })
  }

  const languages = translationSources
    .filter((translation) => translation.collection === source.id)
    .map((translation) => translation.language)
  const index = {
    id: source.id,
    title: source.title,
    description: source.description,
    languages,
    placeholder: Boolean(source.metadata.placeholder),
    metadata: source.metadata,
    chapters,
  }
  await writeFile(join(collectionDirectory, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
  collections.push({
    id: source.id,
    title: source.title,
    description: source.description,
    placeholder: Boolean(source.metadata.placeholder),
    index: `${source.id}/index.json`,
  })
}

for (const source of translationSources) {
  const translationDirectory = join(outputDirectory, 'translations', source.language, source.collection)
  await mkdir(translationDirectory, { recursive: true })
  const groups = groupBy(source.translations, (translation) => translation.chapter)
  for (const [chapterId, entries] of groups) {
    const translations = Object.fromEntries(entries.map(({ id, text }) => [id, { text }]))
    await writeFile(
      join(translationDirectory, `chapter-${chapterId}.json`),
      `${JSON.stringify({ metadata: source.metadata, translations }, null, 2)}\n`,
    )
  }
}

const manifestMetadata = {
  sourceName: 'Generated collection manifest',
  sourceUrl: 'local-build://scripts/import-data.mjs',
  contributor: 'Build system',
  contributorRole: 'editor',
  license: 'CC0-1.0',
  dateRetrieved: '2026-10-04',
  placeholder: true,
}
await writeFile(join(outputDirectory, 'collections.json'), `${JSON.stringify({ metadata: manifestMetadata, collections }, null, 2)}\n`)
console.log(`Built ${collections.length} collection index(es) in public/data.`)
