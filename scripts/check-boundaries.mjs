import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'

const featureRoot = resolve('src/features')
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(resolve(directory, entry.name)) : Promise.resolve([resolve(directory, entry.name)])))
  return files.flat().filter((path) => sourceExtensions.has(path.slice(path.lastIndexOf('.'))))
}

const files = await walk(featureRoot)
const violations = []
for (const file of files) {
  const parts = relative(featureRoot, file).split(sep)
  if (parts.length < 2) continue
  const ownFeature = parts[0]
  const source = await readFile(file, 'utf8')
  const imports = [...source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)].map((match) => match[1])
  for (const specifier of imports) {
    if (!specifier.startsWith('.')) continue
    const target = resolve(dirname(file), specifier)
    const targetParts = relative(featureRoot, target).split(sep)
    if (targetParts.length > 1 && targetParts[0] !== ownFeature) violations.push(`${relative(process.cwd(), file)} imports sibling feature ${specifier}`)
  }
}

if (violations.length) {
  console.error(violations.join('\n'))
  process.exit(1)
}
