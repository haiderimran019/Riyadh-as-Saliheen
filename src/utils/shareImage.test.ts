import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'
import { createShareImage } from './shareImage'

const hadith: HadithRecord = {
  id: 'example-1', collection: 'Example collection', book: 'Example book', chapter: '2', number: '13', chapterNumber: '1',
  arabic: 'هذا مثال عربي اصطناعي للجانبية وليس حديثا منشورا', grades: [], references: [], sourceName: 'Example Arabic publisher',
}
const metadata: DatasetMetadata = {
  sourceName: 'Example translation publisher', sourceUrl: 'https://example.com', contributor: 'Example contributor',
  contributorRole: 'translator', license: 'Synthetic fixture only', dateRetrieved: '2026-10-05', version: 'v1.36.0',
}

describe('share image layout', () => {
  const previousFonts = Object.getOwnPropertyDescriptor(document, 'fonts')
  let draws: Array<{ text: string; font: string; direction: string; x: number; y: number }>
  let canvas: HTMLCanvasElement
  let fontLoads: number
  let loadFonts: ReturnType<typeof vi.fn>

  beforeEach(() => {
    draws = []
    fontLoads = 0
    loadFonts = vi.fn(async () => {
      await Promise.resolve()
      fontLoads++
      return []
    })
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve(), load: loadFonts } })
    const context = {
      font: '', direction: 'ltr', textAlign: 'left', textBaseline: 'alphabetic', fillStyle: '', strokeStyle: '',
      measureText: vi.fn((text: string) => {
        expect(fontLoads).toBeGreaterThanOrEqual(2)
        return { width: Array.from(text).length * 12 }
      }),
      fillText(text: string, x: number, y: number) { draws.push({ text, font: this.font, direction: this.direction, x, y }) },
      fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    }
    canvas = {
      width: 0, height: 0,
      getContext: () => context,
      toBlob: (callback: BlobCallback) => callback(new Blob(['synthetic image'], { type: 'image/png' })),
    } as unknown as HTMLCanvasElement
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => tag === 'canvas' ? canvas : createElement(tag)) as typeof document.createElement)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (previousFonts) Object.defineProperty(document, 'fonts', previousFonts)
    else Reflect.deleteProperty(document, 'fonts')
  })

  it('grows for long content and keeps every translated word and footer inside the image', async () => {
    const short = { text: 'A short synthetic translation.', language: 'en' }
    await createShareImage(hadith, short, metadata)
    const shortHeight = canvas.height
    draws = []
    const words = Array.from({ length: 500 }, (_, index) => `word${index}`)
    await createShareImage(hadith, { text: words.join(' '), language: 'en' }, metadata)
    expect(canvas.height).toBeGreaterThan(shortHeight)
    const translatedLines = draws.filter((draw) => draw.font === '34px "Manrope Variable", system-ui')
    expect(translatedLines.flatMap((draw) => draw.text.split(' '))).toEqual(words)
    expect(translatedLines.every((draw) => draw.direction === 'ltr')).toBe(true)
    expect(draws.map((draw) => draw.text).join(' ')).toContain('Translation source: Example translation publisher · v1.36.0')
    expect(draws.every((draw) => draw.y < canvas.height - 60)).toBe(true)
  })

  it('uses the matching source Arabic and RTL Urdu font with source version and Riyad references', async () => {
    const sourceArabic = 'هذا هو النص العربي الاصطناعي للترجمة المطابقة'
    const translation: Translation = {
      language: 'ur', text: Array.from({ length: 80 }, () => 'یہ صرف فرضی جانچ ہے۔').join(' '),
      raw: { id: 'source-example', title: 'Synthetic source', hadeeth: '', hadeeth_ar: sourceArabic, grade: 'Synthetic source grade' },
    }
    await createShareImage(hadith, translation, { ...metadata, sourceName: 'HadeethEnc.com' })
    const rendered = draws.map((draw) => draw.text).join(' ')
    expect(rendered).toContain(sourceArabic)
    expect(rendered).not.toContain(hadith.arabic)
    expect(rendered).toContain('Urdu · matching narration')
    expect(rendered).toContain('Additional wording in the Riyad entry may differ')
    expect(rendered).toContain('HadeethEnc.com · v1.36.0')
    expect(rendered).toContain('Reference: Example collection, no. 13 · Chapter 2, hadith 1')
    expect(rendered).toContain('Grade not supplied by this edition')
    expect(rendered).not.toContain('Synthetic source grade')
    const urduLines = draws.filter((draw) => draw.font.includes('Noto Nastaliq Urdu'))
    expect(urduLines.length).toBeGreaterThan(1)
    expect(urduLines.every((draw) => draw.direction === 'rtl' && draw.x === 996)).toBe(true)
    expect(urduLines[1].y - urduLines[0].y).toBe(96)
    expect(draws.every((draw) => draw.y < canvas.height - 60)).toBe(true)
    expect(loadFonts).toHaveBeenCalledWith('34px "Noto Nastaliq Urdu", serif', translation.text)
  })
})
