import { expect, test } from '@playwright/test'

const screens = ['Home', 'Library', 'Chapters', 'Reader', 'Search', 'Saved', 'Settings'] as const
const widths = [320, 390, 1440]
for (const width of widths) {
  for (const screen of screens) {
    test(`${screen} has no horizontal overflow at ${width}px`, async ({ page }) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      if (screen === 'Home') await page.goto('./')
      if (screen === 'Library') await page.goto('library')
      if (screen === 'Chapters') await page.goto('collection/riyad-as-salihin')
      if (screen === 'Reader') {
        await page.goto('collection/riyad-as-salihin/chapter/1')
        await expect(page.locator('.hadith-card').first()).toBeVisible()
        await expect(page.locator('.arabic-text').first()).not.toBeEmpty()
        await expect(page.getByText(/Text source: IslamEnc.com/).first()).toBeVisible()
      }
      if (screen === 'Settings') await page.goto('settings')
      if (screen === 'Search') await page.goto('search')
      if (screen === 'Saved') await page.goto('saved')
      await page.waitForLoadState('networkidle')
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
      expect(pageErrors).toEqual([])
      if (width === 360) await page.screenshot({ path: `screenshots/360-${screen.toLowerCase()}.png`, fullPage: true })
    })
  }
}

test('legacy collection route no longer exposes the HadeethEnc topic directory', async ({ page }) => {
  await page.goto('collection/hadeethenc')
  await expect(page).toHaveURL(/\/library$/)
  await expect(page.getByRole('heading', { name: 'Riyad as-Salihin' })).toBeVisible()
  await expect(page.locator('.topic-tree')).toHaveCount(0)
})
