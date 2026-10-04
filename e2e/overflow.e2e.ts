import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const screens = ['Home', 'Library', 'Reader', 'Settings'] as const
const widths = [320, 360, 390, 412, 1440]
await mkdir('screenshots', { recursive: true })

for (const width of widths) {
  for (const screen of screens) {
    test(`${screen} has no horizontal overflow at ${width}px`, async ({ page }) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      if (screen === 'Home') await page.goto('./')
      if (screen === 'Library') await page.goto('library')
      if (screen === 'Reader') {
        await page.goto('collection/hadeethenc')
        const firstTopic = page.locator('.topic-tree a.topic-open').first()
        await firstTopic.evaluate((link) => {
          for (let ancestor = link.parentElement; ancestor; ancestor = ancestor.parentElement) {
            if (ancestor instanceof HTMLDetailsElement) ancestor.open = true
          }
        })
        await firstTopic.waitFor({ state: 'visible' })
        await firstTopic.click()
        await page.locator('.hadith-card').first().waitFor()
      }
      if (screen === 'Settings') await page.goto('settings')
      await page.waitForLoadState('networkidle')
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
      expect(pageErrors).toEqual([])
      if (width === 360) await page.screenshot({ path: `screenshots/360-${screen.toLowerCase()}.png`, fullPage: true })
    })
  }
}

test('five Arabic and English hadith remain available offline after first reading', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 900 })
  await page.goto('collection/hadeethenc')
  const firstTopic = page.locator('.topic-tree a.topic-open').first()
  await firstTopic.evaluate((link) => {
    for (let ancestor = link.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor instanceof HTMLDetailsElement) ancestor.open = true
    }
  })
  await firstTopic.click()
  await expect(page.locator('.arabic-text').first()).toBeVisible({ timeout: 30_000 })
  await page.locator('.hadith-card').nth(4).waitFor()
  expect(await page.locator('.hadith-card').count()).toBeGreaterThanOrEqual(5)
  await expect(page.locator('.translation-block').first()).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.locator('.hadith-card').nth(4).waitFor()
  const cacheStatus = await page.evaluate(async () => {
    const names = await caches.keys()
    const requests = await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))
    return { controller: navigator.serviceWorker.controller?.scriptURL ?? null, caches: names, dataFiles: requests.flat().filter((url) => url.includes('/data-local/generated/')) }
  })
  expect(cacheStatus.controller).toBeTruthy()
  expect(cacheStatus.dataFiles.length).toBeGreaterThanOrEqual(3)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.hadith-card').nth(4)).toBeVisible({ timeout: 30_000 })
  expect(await page.locator('.hadith-card').count()).toBeGreaterThanOrEqual(5)
  await expect(page.locator('.arabic-text').nth(4)).not.toBeEmpty()
  await expect(page.locator('.translation-block').nth(4)).toBeVisible()
})
