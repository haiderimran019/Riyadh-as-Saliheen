import { expect, test } from '@playwright/test'

const routes = ['/', '/collection/nawawi-placeholder/chapter/1', '/settings']
const widths = [320, 390, 1440]

for (const width of widths) {
  for (const route of routes) {
    test(`${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
    })
  }
}
