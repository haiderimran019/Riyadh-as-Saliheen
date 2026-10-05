import { expect, test } from '@playwright/test'

const screens = ['Home', 'Library', 'Chapters', 'Reader', 'Search', 'Saved', 'Settings'] as const
const widths = [320, 390, 768, 1024, 1440]
for (const width of widths) {
  for (const screen of screens) {
    test(`${screen} has no horizontal overflow at ${width}px`, async ({ page }) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await page.setViewportSize({ width, height: 900 })
      if (screen === 'Home') {
        await page.goto('./')
        await expect(page.locator('.everyday-card')).toHaveCount(6)
      }
      if (screen === 'Library') await page.goto('library')
      if (screen === 'Chapters') await page.goto('collection/riyad-as-salihin')
      if (screen === 'Reader') {
        await page.goto('collection/riyad-as-salihin/chapter/1')
        await expect(page.locator('.hadith-card').first()).toBeVisible()
        await expect(page.locator('.arabic-text').first()).not.toBeEmpty()
        await expect(page.getByText('Grade not supplied by this edition').first()).toBeVisible()
        await expect(page.locator('.chapter-progress progress')).toBeVisible()
        await expect(page.locator('.chapter-navigation')).toBeVisible()
        await expect(page.locator('.site-footer').getByText(/IslamHouse.com.*IslamEnc.com/)).toBeVisible()
        await expect(page.locator('.floating-nav')).toBeVisible()
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

test('daily scripture uses a restrained Arabic scale on iPhone and iPad widths', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.daily-hadith .daily-arabic')).toBeVisible()
  await expect(page.locator('.daily-ayah .daily-arabic')).toBeVisible()

  for (const [width, maxArabic] of [[390, 25], [768, 32]] as const) {
    await page.setViewportSize({ width, height: 900 })
    for (const selector of ['.daily-hadith .daily-arabic', '.daily-ayah .daily-arabic']) {
      const style = await page.locator(selector).evaluate((element) => ({
        size: Number.parseFloat(getComputedStyle(element).fontSize),
        font: getComputedStyle(element).fontFamily,
      }))
      expect(style.size).toBeLessThanOrEqual(maxArabic)
      expect(style.font).toContain('Amiri')
    }
    const translationSize = await page.locator('.daily-ayah .daily-translation').evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    expect(translationSize).toBeLessThanOrEqual(18)
  }
})

test('Urdu stays within phone width across every app screen', async ({ page }) => {
  test.setTimeout(120_000)
  const routes = [
    './',
    'library',
    'collection/riyad-as-salihin',
    'collection/riyad-as-salihin/chapter/1',
    'search',
    'saved',
    'settings',
    'sources',
    'about',
    'privacy',
    'terms',
  ]

  await page.goto('settings')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.getByRole('button', { name: 'Urdu' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ur')

  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of routes) {
      await page.goto(route)
      await expect(page.locator('html')).toHaveAttribute('lang', 'ur')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.bismillah-splash')).toBeHidden()
      if (route === './') {
        await expect(page.getByRole('heading', { name: 'ایک موضوع چنیں، اپنی رفتار سے پڑھیں۔' })).toBeVisible()
        await expect(page.locator('.everyday-card')).toHaveCount(6)
        await expect(page.locator('.everyday-card strong').first()).toHaveText('نیت سے آغاز کریں')
        await expect(page.locator('.everyday-heading h2')).toHaveCSS('font-family', /Noto Nastaliq Urdu/)
      }
      const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
      expect(dimensions.scroll, `Urdu overflow on ${route} at ${width}px`).toBeLessThanOrEqual(dimensions.client)
      const textOverflow = await page.locator('.home-hero h1, .home-intro, .reader-heading h1, .translation-block[lang="ur"] > p, .daily-translation').evaluateAll((elements) => elements.filter((element) => element instanceof HTMLElement && element.scrollWidth > element.clientWidth).map((element) => element.className))
      expect(textOverflow, `Urdu text clipped on ${route} at ${width}px`).toEqual([])
    }
  }
})

test('legacy collection route no longer exposes the HadeethEnc topic directory', async ({ page }) => {
  await page.goto('collection/hadeethenc')
  await expect(page).toHaveURL(/\/library$/)
  await expect(page.getByRole('heading', { name: 'Riyad as-Salihin' })).toBeVisible()
  await expect(page.locator('.topic-tree')).toHaveCount(0)
})
