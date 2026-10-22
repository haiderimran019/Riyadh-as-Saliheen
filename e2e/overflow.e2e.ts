import { expect, test } from '@playwright/test'
const routes = { Home:'', Library:'library', Chapters:'collection/riyad-as-salihin', Reader:'collection/riyad-as-salihin/chapter/1', Search:'search', Saved:'saved', Settings:'settings' }
for (const width of [320, 390, 768, 1024, 1440]) for (const [screen, route] of Object.entries(routes)) {
  test(`${screen} has no overflow or runtime errors at ${width}px`, async ({ page }) => {
    const errors:string[] = []; page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height:900 }); await page.goto(route || './')
    if (screen === 'Home') { await expect(page.locator('.reading-path')).toHaveCount(6); await expect(page.locator('.invitation-art img')).toBeVisible(); expect(await page.locator('.invitation-art img').evaluate((img:HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true) }
    if (screen === 'Library' || screen === 'Chapters') await expect(page.locator('.chapter-row')).toHaveCount(24)
    if (screen === 'Reader') { await expect(page.locator('.hadith-card')).toHaveCount(1); await expect(page.locator('.arabic-text').first()).not.toBeEmpty(); await expect(page.locator('.chapter-progress progress')).toBeVisible(); await expect(page.locator('.passage-navigation')).toBeVisible() }
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })
}
for (const width of [320,360,390,768,1440]) test(`Urdu stays within ${width}px across all routes`, async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width, height:900 }); await page.goto('settings'); await page.getByRole('banner').getByRole('button', { name:'اردو (Urdu)', exact:true }).click()
  for (const route of ['', 'library', 'collection/riyad-as-salihin', 'collection/riyad-as-salihin/chapter/1', 'collection/riyad-as-salihin/chapter/2#13-1', 'collection/riyad-as-salihin/chapter/119', 'search', 'saved', 'settings', 'sources', 'about', 'privacy', 'terms']) {
    await page.goto(route || './'); await page.waitForLoadState('networkidle'); await expect(page.locator('html')).toHaveAttribute('lang','ur')
    if (!route) await expect(page.locator('.reading-path')).toHaveCount(6)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), route).toBeLessThanOrEqual(1)
    const clipped = await page.locator('.room-heading h1,.translation-block > p,.daily-translation,.chapter-row-copy strong').evaluateAll((elements) => elements.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.className))
    expect(clipped, route).toEqual([])
  }
})
test('themes retain readable copy and illustration; display sheet fits a 320px phone', async ({ page }) => {
  await page.setViewportSize({width:320,height:844}); await page.goto('./'); await expect(page.locator('.reading-path')).toHaveCount(6)
  await page.getByRole('button',{name:'Open reading display settings'}).click()
  for (const theme of ['Night','Day']) {
    await page.getByRole('button',{name:theme,exact:true}).click(); await expect(page.locator('html')).toHaveAttribute('data-theme',theme === 'Day' ? 'light' : 'dark')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  }
  await page.getByRole('button',{name:'Close reading settings'}).click()
  await expect(page.locator('.art-caption')).toHaveText('رياض الصالحين')
})
test('mobile menu is keyboard accessible and closes after navigation', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('./'); await page.getByRole('button',{name:'Open menu'}).click()
  await expect(page.locator('.workspace-sidebar')).toHaveClass(/is-open/)
  await page.locator('.workspace-navigation').getByRole('link',{name:/The collection/}).click()
  await expect(page).toHaveURL(/\/library$/); await expect(page.locator('.workspace-sidebar')).not.toHaveClass(/is-open/)
  await page.getByRole('button',{name:'Open menu'}).click(); await page.keyboard.press('Escape'); await expect(page.getByRole('button',{name:'Open menu'})).toBeFocused()
})
test('legacy collection redirects to the real chapter catalogue', async ({ page }) => {
  await page.goto('collection/hadeethenc'); await expect(page).toHaveURL(/\/library$/); await expect(page.getByRole('heading',{name:'The collection',exact:true})).toBeVisible(); await expect(page.locator('.chapter-row')).toHaveCount(24)
})
