import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const [arabicPath, translationPath, collectionId = 'pending-collection'] = process.argv.slice(2)

if (!arabicPath) {
  console.error('Usage: npm run data:adapt:fawaz -- <arabic-edition.json> [translation-edition.json] [collection-id]')
  process.exit(1)
}

const outputDirectory = join(root, 'scripts', 'source-data', 'real', collectionId)
await mkdir(outputDirectory, { recursive: true })

const readEdition = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'))
const arabicEdition = await readEdition(arabicPath)

const metadataTemplate = (sourceFile, role) => ({
  sourceName: `fawazahmed0/hadith-api: ${basename(sourceFile)}`,
  sourceUrl: '[REQUIRED: exact revision-pinned source URL]',
  contributor: `[REQUIRED: ${role === 'translator' ? 'translator' : 'editor'} name]`,
  contributorRole: role,
  license: '[REQUIRED: verified licence for this exact file]',
  dateRetrieved: '[REQUIRED: YYYY-MM-DD]',
  placeholder: false,
})

const records = (arabicEdition.hadiths ?? []).map((entry) => ({
  id: `${collectionId}-${entry.hadithnumber}`,
  collection: collectionId,
  book: String(entry.reference?.book ?? '[REQUIRED book]'),
  chapter: String(entry.reference?.book ?? '1'),
  chapterTitle: String(entry.reference?.book ?? '[REQUIRED chapter title]'),
  number: String(entry.hadithnumber),
  arabic: entry.text,
  grades: (entry.grades ?? []).map((grade) => ({ grader: grade.name, grade: grade.grade })),
  references: [{ collection: collectionId, number: String(entry.hadithnumber) }],
}))

await writeFile(
  join(outputDirectory, 'arabic.json'),
  `${JSON.stringify({
    metadata: metadataTemplate(arabicPath, 'editor'),
    id: collectionId,
    title: '[REQUIRED collection title]',
    description: '[REQUIRED collection description]',
    records,
  }, null, 2)}\n`,
)

if (translationPath) {
  const edition = await readEdition(translationPath)
  const translations = (edition.hadiths ?? []).map((entry) => ({
    id: `${collectionId}-${entry.hadithnumber}`,
    chapter: String(entry.reference?.book ?? '1'),
    text: entry.text,
  }))
  await writeFile(
    join(outputDirectory, 'translation.json'),
    `${JSON.stringify({
      metadata: metadataTemplate(translationPath, 'translator'),
      collection: collectionId,
      language: '[REQUIRED BCP-47 language code]',
      translations,
    }, null, 2)}\n`,
  )
}

console.log(`Wrote ignored review files to ${outputDirectory}. Complete every [REQUIRED ...] field before approval.`)
