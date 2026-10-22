import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ArabicChapterDataset, CollectionIndex, TranslationChapterDataset } from '../src/types/hadith'
import { normalizeArabic } from '../src/search/normalize'

test.use({ viewport: { width: 390, height: 844 } })

function loadRiyadFixture() {
  const dataRoot = resolve('data-local/generated')
  const load = <T,>(path: string) => JSON.parse(readFileSync(resolve(dataRoot, path), 'utf8')) as T
  const collection = load<CollectionIndex>('riyad-as-salihin/index.json')
  const arabic = load<ArabicChapterDataset>('riyad-as-salihin/all.json')
  const urdu = load<TranslationChapterDataset>('translations/ur/riyad-as-salihin/all.json')
  const english = load<TranslationChapterDataset>('translations/en/riyad-as-salihin/all.json')
  const translated = arabic.records.find((record) => urdu.translations[record.id]?.raw?.hadeeth_ar && urdu.translations[record.id].text.length > 180 && english.translations[record.id])
  const missing = arabic.records.find((record) => !urdu.translations[record.id] && english.translations[record.id])
  if (!translated || !missing) throw new Error('Reader tests require an imported partial Urdu edition with matched and missing narrations.')
  const translation = urdu.translations[translated.id]
  if (!translation.raw) throw new Error('The matched Urdu translation must retain its published source record.')
  const terms = [...new Set(normalizeArabic(translation.text).split(/[^\p{Letter}\p{Number}]+/u).filter((term) => /^\p{Script=Arabic}{5,}$/u.test(term)))]
  const searchableText = arabic.records.map((record) => normalizeArabic(`${record.arabic} ${urdu.translations[record.id]?.text ?? ''}`))
  terms.sort((a, b) => searchableText.filter((text) => text.includes(a)).length - searchableText.filter((text) => text.includes(b)).length)
  const searchTerm = terms[0]
  if (!searchTerm) throw new Error('No Urdu search term was found in the imported narration.')
  return { collection, urdu, english, translated, translation, sourceArabic: translation.raw.hadeeth_ar, missing, searchTerm }
}

let fixture: ReturnType<typeof loadRiyadFixture>
test.beforeAll(() => { fixture = loadRiyadFixture() })

test('reader language, bookmark, folder, and return link work on mobile', async ({ page }) => {
  await page.goto('collection/riyad-as-salihin/chapter/1')
  await expect(page.locator('.hadith-card').first()).toBeVisible()
  await expect(page.getByText('Grade filter')).toHaveCount(0)
  await expect(page.locator('.context-pane')).toHaveCount(0)
  await expect(page.getByText('Grade not available')).toHaveCount(0)
  await expect(page.locator('.translation-block').first()).toBeVisible()
  await page.goto('settings')
  await page.getByRole('banner').getByRole('button', { name: 'اردو (Urdu)', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.goto('collection/riyad-as-salihin/chapter/1')
  await expect(page.locator('.reader-chapter-count')).toContainText('دستیاب اردو تراجم')
  await expect(page.locator('.reader-page > .read-pane > .notice')).toHaveCount(0)
  await expect(page.locator('[id="1-1"] .translation-block')).toHaveCount(0)
  await expect(page.locator('[id="1-1"] > .notice')).toHaveText('اس روایت کا اردو ترجمہ دستیاب نہیں؛ اصل عربی متن اوپر درج ہے۔')
  await page.getByRole('button', { name: 'حدیث محفوظ کریں 1', exact: true }).click()
  await page.getByRole('button', { name: 'مینو کھولیں' }).click()
  await page.locator('.workspace-navigation').getByRole('link', { name: /محفوظ احادیث/ }).click()
  await expect(page.locator('.saved-reference')).toContainText('حدیث 1')
  await page.getByRole('textbox', { name: 'نئے فولڈر کا نام' }).fill('Study')
  await page.getByRole('button', { name: 'فولڈر بنائیں' }).click()
  await expect(page.getByRole('button', { name: 'Study', exact: true })).toBeVisible()
  await page.locator('.saved-reference').click()
  await expect(page).toHaveURL(/chapter\/1#1-1$/)
  await expect(page.locator('[id="1-1"]')).toBeVisible()
})

test('reading settings theme icons switch light and dark without overflow', async ({ page }) => {
  await page.goto('settings')
  await page.getByRole('button', { name: /Text appearance/ }).click()
  await expect(page.getByRole('dialog', { name: 'Reading settings' })).toBeVisible()
  await page.getByRole('button', { name: 'Day', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Night', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('English translation search opens the matching passage inside the app', async ({ page }) => {
  await page.goto('search')
  await page.getByRole('searchbox', { name: 'Search hadith' }).fill('intentions')
  await expect(page.locator('.search-result').first()).toBeVisible()
  await page.locator('.search-result').first().click()
  await expect(page).toHaveURL(/\/collection\/riyad-as-salihin\/chapter\/\d+#/)
  await expect(page.locator('.hadith-card').first()).toBeVisible()
})

test('daily hadith and ayah have translations appropriate to the selected app language', async ({ page }) => {
  const rotationMs = 6 * 60 * 60 * 1000
  const ids = fixture.collection.recordIds ?? []
  const targetIndex = ids.indexOf(fixture.translated.id)
  expect(targetIndex).toBeGreaterThanOrEqual(0)
  const currentWindow = Math.floor(Date.now() / rotationMs)
  const offset = (targetIndex - currentWindow % ids.length + ids.length) % ids.length
  await page.clock.install({ time: new Date((currentWindow + offset) * rotationMs + 1000) })
  await page.goto('./')
  await expect(page.locator('.daily-hadith')).toBeVisible()
  await expect(page.locator('.daily-hadith .daily-translation[lang="en"]')).toHaveText(fixture.english.translations[fixture.translated.id].text)
  await expect(page.locator('.daily-ayah .daily-translation[lang="en"]')).toBeVisible()
  await page.goto('settings')
  await page.getByRole('banner').getByRole('button', { name: 'اردو (Urdu)', exact: true }).click()
  await page.getByRole('button', { name: 'مینو کھولیں' }).click()
  await page.getByRole('link', { name: 'ریاض الصالحین — صفحۂ اول' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('.daily-ayah .daily-translation[lang="ur"]')).toBeVisible()
  await expect(page.locator('.daily-hadith .daily-translation[lang="ur"]')).toHaveText(fixture.translation.text)
  await expect(page.locator('.daily-hadith .daily-translation[lang="ur"]')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('.daily-hadith .daily-translation[lang="en"]')).toHaveCount(0)
  await expect(page.locator('.daily-hadith')).toContainText('اردو · مماثل روایت')
  await expect(page.locator('.daily-hadith .daily-source-line')).toContainText(`${fixture.urdu.metadata.sourceName} · ${fixture.urdu.metadata.version}`)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur')
})

test('partial Urdu keeps published matching text, attribution, and Arabic-only gaps honest', async ({ page, context }) => {
  await page.goto('settings')
  await page.getByRole('banner').getByRole('button', { name: 'اردو (Urdu)', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur')
  const record = fixture.translated
  await page.goto(`collection/riyad-as-salihin/chapter/${record.chapter}#${record.id}`)
  const card = page.locator(`.hadith-card[id="${record.id}"]`)
  const translation = card.locator('.translation-block[lang="ur"]')
  await expect(translation).toHaveAttribute('dir', 'rtl')
  await expect(translation.locator(':scope > p')).toHaveText(fixture.translation.text)
  expect(await translation.locator(':scope > p').textContent()).toBe(fixture.translation.text)
  await expect(translation.locator('.translation-label')).toHaveText('اردو · مماثل روایت')
  await expect(translation).toContainText('یہ اردو متن HadeethEnc کی مماثل روایت کا ترجمہ ہے؛ ریاض الصالحین کے نسخے کی اضافی عبارت مختلف ہو سکتی ہے۔')
  await expect(card.locator('.translation-block[lang="en"]')).toHaveCount(0)
  await expect(translation.locator(':scope > p')).not.toHaveText(fixture.english.translations[record.id].text)
  await translation.locator('.translation-about > summary').click()
  await expect(translation.locator('.translation-about')).toContainText(`${fixture.urdu.metadata.sourceName} · ${fixture.urdu.metadata.version}`)
  await translation.getByText('اس ترجمے کا اصل عربی متن', { exact: true }).click()
  const sourceArabic = translation.locator('.translation-about details .arabic-text')
  await expect(sourceArabic).toHaveAttribute('lang', 'ar')
  await expect(sourceArabic).toHaveAttribute('dir', 'rtl')
  await expect(sourceArabic).toHaveText(fixture.sourceArabic)
  expect(await sourceArabic.textContent()).toBe(fixture.sourceArabic)

  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await card.getByRole('button', { name: `کاپی کریں حدیث ${record.chapterNumber}`, exact: true }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(fixture.translation.text)
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied.startsWith(fixture.sourceArabic)).toBe(true)
  expect(copied).toContain(`${fixture.urdu.metadata.sourceName} · ${fixture.urdu.metadata.version}`)
  expect(copied).toContain('HadeethEnc کی مماثل روایت')

  await page.goto(`collection/riyad-as-salihin/chapter/${fixture.missing.chapter}#${fixture.missing.id}`)
  const missing = page.locator(`.hadith-card[id="${fixture.missing.id}"]`)
  await expect(missing.locator(':scope > .arabic-text')).toHaveText(fixture.missing.arabic)
  await expect(missing.locator('.translation-block')).toHaveCount(0)
  await expect(missing.locator(':scope > .notice')).toHaveText('اس روایت کا اردو ترجمہ دستیاب نہیں؛ اصل عربی متن اوپر درج ہے۔')
  await expect(page.locator('.reader-page > .read-pane > .notice')).toHaveCount(0)
})

test('available Urdu translation search opens its matching record with RTL text', async ({ page }) => {
  await page.goto('settings')
  await page.getByRole('banner').getByRole('button', { name: 'اردو (Urdu)', exact: true }).click()
  await page.goto('search')
  await page.getByRole('searchbox', { name: 'حدیث تلاش کریں' }).fill(fixture.searchTerm)
  const record = fixture.translated
  const result = page.locator(`.search-result[href$="/chapter/${record.chapter}#${record.id}"]`)
  await expect(result).toBeVisible()
  await expect(result.locator('.result-translation')).toHaveAttribute('lang', 'ur')
  await expect(result.locator('.result-translation')).toHaveAttribute('dir', 'rtl')
  await expect(result.locator('.result-translation')).toHaveText(fixture.translation.text)
  expect(await result.locator('.result-translation').textContent()).toBe(fixture.translation.text)
  await expect(result.locator('.result-source')).toContainText(`${fixture.urdu.metadata.sourceName} · ${fixture.urdu.metadata.version}`)
  await result.click()
  await expect(page).toHaveURL(new RegExp(`/chapter/${record.chapter}#${record.id}$`))
  await expect(page.locator(`.hadith-card[id="${record.id}"] .translation-block[lang="ur"] > p`)).toHaveText(fixture.translation.text)
})

test('chapter finder narrows the original collection without leaving the site', async ({ page }) => {
  await page.goto('collection/riyad-as-salihin')
  await page.getByRole('searchbox', { name: 'Find a chapter' }).fill('Repentance')
  await expect(page.locator('.chapter-row')).toHaveCount(1)
  await page.locator('.chapter-row').click()
  await expect(page).toHaveURL(/chapter\/2$/)
  await expect(page.locator('.hadith-card').first()).toBeVisible()
})
