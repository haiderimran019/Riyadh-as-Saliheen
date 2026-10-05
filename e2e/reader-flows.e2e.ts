import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('reader language, bookmark, folder, and return link work on mobile', async ({ page }) => {
  await page.goto('collection/riyad-as-salihin/chapter/1')
  await expect(page.locator('.hadith-card').first()).toBeVisible()
  expect(await page.locator('.reader-toolbar .language-control select').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(120)
  await expect(page.locator('.translation-block').first()).toBeVisible()
  await page.getByRole('combobox', { name: 'Translation language' }).selectOption('ar')
  await expect(page.locator('.translation-block')).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Translation language' }).selectOption('en')
  await expect(page.locator('.translation-block').first()).toBeVisible()
  await page.getByRole('button', { name: 'Save hadith 1', exact: true }).click()
  await page.getByRole('link', { name: 'Riyad as-Salihin home' }).click()
  await page.getByRole('link', { name: 'Saved', exact: true }).click()
  await expect(page.getByRole('link', { name: /Hadith 1.*Open reading/ })).toBeVisible()
  await page.getByRole('textbox', { name: 'New folder name' }).fill('Study')
  await page.getByRole('button', { name: 'Add folder' }).click()
  await expect(page.getByRole('button', { name: 'Study', exact: true })).toBeVisible()
  await page.getByRole('link', { name: /Hadith 1.*Open reading/ }).click()
  await expect(page).toHaveURL(/chapter\/1#1-1$/)
  await expect(page.locator('[id="1-1"]')).toBeVisible()
})

test('English translation search opens the matching passage inside the app', async ({ page }) => {
  await page.goto('search')
  await page.getByRole('searchbox', { name: 'Search hadith' }).fill('intentions')
  await expect(page.locator('.search-result').first()).toBeVisible()
  await page.locator('.search-result').first().click()
  await expect(page).toHaveURL(/\/collection\/riyad-as-salihin\/chapter\/\d+#/)
  await expect(page.locator('.hadith-card').first()).toBeVisible()
})

test('chapter finder narrows the original collection without leaving the site', async ({ page }) => {
  await page.goto('collection/riyad-as-salihin')
  await page.getByRole('searchbox', { name: 'Find a chapter' }).fill('Repentance')
  await expect(page.locator('.chapter-row')).toHaveCount(1)
  await page.locator('.chapter-row').click()
  await expect(page).toHaveURL(/chapter\/2$/)
  await expect(page.locator('.hadith-card').first()).toBeVisible()
})
