import { APP_NAME } from '../config'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  for (const paragraph of text.split(/\r\n|\r|\n/u)) {
    let line = ''
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      line = ''
      // A long unbroken word must also fit without losing any characters.
      for (const character of Array.from(word)) {
        const fragment = line + character
        if (context.measureText(fragment).width > maxWidth && line) {
          lines.push(line)
          line = character
        } else {
          line = fragment
        }
      }
    }
    lines.push(line)
  }
  return lines
}

function drawLines(context: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

export async function createShareImage(
  hadith: HadithRecord,
  translation?: Translation,
  translationMetadata?: DatasetMetadata,
) {
  const isUrdu = translation?.language === 'ur'
  const matchingUrdu = isUrdu && Boolean(translation?.raw?.hadeeth_ar)
  const arabicText = matchingUrdu ? translation!.raw!.hadeeth_ar : hadith.arabic
  const arabicFont = '52px Amiri, serif'
  const translationFont = isUrdu ? '34px "Noto Nastaliq Urdu", serif' : '34px "Manrope Variable", system-ui'
  await Promise.all([
    document.fonts.load('700 34px "Manrope Variable"', APP_NAME),
    document.fonts.load(arabicFont, arabicText),
    ...(translation ? [document.fonts.load(translationFont, translation.text)] : []),
  ])
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  type TextBlock = {
    lines: string[]
    font: string
    color: string
    direction: CanvasDirection
    align: CanvasTextAlign
    y: number
    lineHeight: number
  }
  const blocks: TextBlock[] = []
  let y = 104
  let dividerY: number | undefined
  function addText(text: string, font: string, lineHeight: number, color: string, spacing = 0, rtl = false) {
    context!.font = font
    context!.direction = rtl ? 'rtl' : 'ltr'
    const lines = wrapText(context!, text, 912)
    blocks.push({ lines, font, lineHeight, color, y, direction: rtl ? 'rtl' : 'ltr', align: rtl ? 'right' : 'left' })
    y += lines.length * lineHeight + spacing
  }

  addText(APP_NAME, '700 34px "Manrope Variable", system-ui', 46, '#f5f3e8', 6)
  addText(`Hadith ${hadith.chapterNumber ?? hadith.number} · ${hadith.book} · Chapter ${hadith.chapter}`, '600 25px system-ui', 38, '#c1d1c5', 64)
  if (matchingUrdu) {
    addText('Urdu · matching narration', '600 26px "Manrope Variable", system-ui', 40, '#d8c88f', 2)
    addText('Additional wording in the Riyad entry may differ from this matched narration.', '22px system-ui', 34, '#c1d1c5', 38)
  }
  addText(arabicText, arabicFont, 94, '#f5f3e8', 36, true)

  if (translation && translationMetadata) {
    dividerY = y
    y += 65
    addText(translation.text, translationFont, isUrdu ? 96 : 52, '#f5f3e8', 26, isUrdu)
    const sourceVersion = translationMetadata.version ? ` · ${translationMetadata.version}` : ''
    addText(`Translation source: ${translationMetadata.sourceName}${sourceVersion}`, '20px system-ui', 32, '#c1d1c5', 24)
  }

  const grade = hadith.grades.length > 0
    ? hadith.grades.map((item) => `${item.grade} · graded by ${item.grader}`).join('; ')
    : 'Grade not supplied by this edition'
  const footerStart = blocks.length
  addText(grade, '700 24px system-ui', 36, '#afd2b8', 12)
  addText(`Reference: ${hadith.collection}, no. ${hadith.number} · Chapter ${hadith.chapter}, hadith ${hadith.chapterNumber ?? hadith.number}`, '22px system-ui', 34, '#c1d1c5', 6)
  addText(matchingUrdu ? translationMetadata?.sourceName ?? 'HadeethEnc.com' : hadith.sourceName ?? 'IslamHouse.com · IslamEnc.com', '22px system-ui', 34, '#c1d1c5')

  // Resizing clears the canvas state. Measure every block first, then apply
  // its font and direction again while rendering the complete content.
  canvas.height = Math.max(1350, Math.ceil(y + 84))
  const footerOffset = canvas.height - y - 84
  for (const block of blocks.slice(footerStart)) block.y += footerOffset
  context.fillStyle = '#0c3527'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#d8c88f'
  context.fillRect(0, 0, canvas.width, 22)
  if (dividerY !== undefined) {
    context.strokeStyle = '#315e4c'
    context.beginPath()
    context.moveTo(84, dividerY)
    context.lineTo(996, dividerY)
    context.stroke()
  }
  context.textBaseline = 'alphabetic'
  for (const block of blocks) {
    context.font = block.font
    context.fillStyle = block.color
    context.textAlign = block.align
    context.direction = block.direction
    drawLines(context, block.lines, block.align === 'right' ? 996 : 84, block.y, block.lineHeight)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to create image')), 'image/png')
  })
}

export async function shareHadithImage(hadith: HadithRecord, translation?: Translation, metadata?: DatasetMetadata) {
  const blob = await createShareImage(hadith, translation, metadata)
  const localNumber = hadith.chapterNumber ?? hadith.number
  const file = new File([blob], `hadith-${hadith.chapter}-${localNumber}.png`, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${APP_NAME} · Hadith ${localNumber}` })
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'AbortError') throw error
    }
    return
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}
