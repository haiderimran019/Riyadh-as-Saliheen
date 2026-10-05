import { APP_NAME } from '../config'
import type { DatasetMetadata, HadithRecord, Translation } from '../types/hadith'

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
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
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  context.fillStyle = '#111916'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#a9d0bd'
  context.fillRect(0, 0, canvas.width, 22)
  context.fillStyle = '#f1f4ed'
  context.textAlign = 'left'
  context.direction = 'ltr'
  context.font = '700 34px Manrope Variable, system-ui'
  context.fillText(APP_NAME, 84, 104)
  context.fillStyle = '#b0beb5'
  context.font = '600 25px system-ui'
  context.fillText(`Hadith ${hadith.number} · ${hadith.book} · Chapter ${hadith.chapter}`, 84, 152)

  context.fillStyle = '#f1f4ed'
  context.textAlign = 'right'
  context.direction = 'rtl'
  context.font = '52px Amiri, serif'
  let y = drawLines(context, wrapText(context, hadith.arabic, 912), 996, 260, 94) + 36

  if (translation && translationMetadata) {
    context.strokeStyle = '#34433a'
    context.beginPath()
    context.moveTo(84, y)
    context.lineTo(996, y)
    context.stroke()
    y += 55
    context.textAlign = 'left'
    context.direction = 'ltr'
    context.fillStyle = '#f1f4ed'
    context.font = '34px Manrope Variable, system-ui'
    y = drawLines(context, wrapText(context, translation.text, 912), 84, y, 52) + 26
    context.fillStyle = '#b0beb5'
    context.font = '20px system-ui'
    y = drawLines(context, wrapText(context, `Translation source: ${translationMetadata.sourceName}`, 912), 84, y, 30) + 20
  }

  context.textAlign = 'left'
  context.direction = 'ltr'
  context.fillStyle = '#a9d0bd'
  context.font = '700 24px system-ui'
  const grade = hadith.grades.length > 0
    ? hadith.grades.map((item) => `${item.grade} · graded by ${item.grader}`).join('; ')
    : 'Grade not available'
  context.fillText(grade, 84, 1238)
  context.fillStyle = '#b0beb5'
  context.font = '22px system-ui'
  context.fillText(`Reference: ${hadith.collection}, no. ${hadith.number}`, 84, 1288)
  context.textAlign = 'right'
  context.fillText(hadith.sourceName ?? 'IslamHouse.com · IslamEnc.com', 996, 1288)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to create image')), 'image/png')
  })
}

export async function shareHadithImage(hadith: HadithRecord, translation?: Translation, metadata?: DatasetMetadata) {
  const blob = await createShareImage(hadith, translation, metadata)
  const file = new File([blob], `hadith-${hadith.number}.png`, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${APP_NAME} · Hadith ${hadith.number}` })
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
