import { expect,test } from '@playwright/test'
import { readFileSync,readdirSync } from 'node:fs'
import { resolve } from 'node:path'
const appOrigin=process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/,'')||'http://127.0.0.1:5174'
const screenshotDir=process.env.RIYAD_SCREENSHOT_DIR||'screenshots/services'
for(const width of [320,390,768,1440])for(const route of ['prayers','quran','quran/1','account','reminders','privacy'])test(`${route} works without overflow at ${width}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto(route);await page.waitForLoadState('networkidle')
 if(route==='quran')await expect(page.locator('.surah-row')).toHaveCount(114)
 if(route==='quran/1')await expect(page.locator('.quran-ayah')).toHaveCount(7)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);expect(errors).toEqual([])
})
test('GPS permission is user-initiated, calculation works and anonymous location stays off the account server',async({page,context})=>{
 await context.setGeolocation({latitude:24.8607,longitude:67.0011});await context.grantPermissions(['geolocation'])
 await page.goto('./');expect(await page.evaluate(()=>localStorage.getItem('prayer-location'))).toBeNull()
 await page.goto('prayers');await page.getByRole('button',{name:'Use my location',exact:true}).first().click();await expect(page.locator('.prayer-time-list > div')).toHaveCount(6)
 await expect(page.getByText('Current location',{exact:true})).toBeVisible();await expect(page.locator('.location-account')).toContainText('Sign in if you want')
 expect((await page.request.get(`${appOrigin}/api/account`)).status()).toBe(401)
 await page.getByRole('combobox',{name:'Asr calculation'}).selectOption('hanafi');await expect(page.locator('.prayer-time-list')).toBeVisible()
})
test('Quran translation, notes, pagination and direct ayah links work',async({page})=>{
 await page.goto('quran/1');await expect(page.locator('.quran-translation')).toHaveCount(7)
 await page.getByRole('button',{name:/English translation/}).click();await expect(page.locator('.quran-translation')).toHaveCount(0)
 await page.getByRole('button',{name:/English translation/}).click();await page.locator('.quran-translation details summary').first().click();await expect(page.locator('.quran-translation details[open] p').first()).toBeVisible()
 await page.goto('quran/2?ayah=255');await expect(page.locator('#ayah-255')).toBeVisible();await expect(page.locator('.quran-ayah')).toHaveCount(10)
 await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page).toHaveURL(/ayah=261/)
 await page.goto('quran');await page.getByRole('searchbox',{name:'Find a surah'}).fill('Fatihah');await expect(page.locator('.surah-row')).toHaveCount(1)
})
test('real email signup, verification, login, saved GPS consent, reminder preferences, export and deletion',async({page})=>{
 const email=`browser-${Date.now()}@example.test`,password='Example-browser-password-345!'
 await page.goto('account?mode=signup');await page.getByRole('textbox',{name:'Name',exact:true}).fill('Browser integration test');await page.getByRole('textbox',{name:'Email address',exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('checkbox').check();await page.locator('.account-form').getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('status')).toContainText('Check your email')
 const folder=resolve(process.env.RIYAD_DATA_DIR||'.data','mail');let url='';await expect.poll(()=>{const mail=readdirSync(folder).map(x=>JSON.parse(readFileSync(resolve(folder,x),'utf8'))).find(x=>x.to===email);url=mail?.url||'';return !!url}).toBe(true)
 await page.goto(url);await expect(page.locator('.profile-panel')).toContainText(email)
 await page.goto('prayers');await page.getByRole('combobox',{name:'Or choose a city'}).selectOption({label:'Karachi, Pakistan'});await expect(page.locator('.prayer-time-list > div')).toHaveCount(6)
 const save=page.getByRole('button',{name:'Save location to account'});await expect(save).toBeDisabled();await page.locator('.location-account').getByRole('checkbox').check();await save.click();await expect(page.getByRole('status')).toContainText('approximate location is saved')
 await page.goto('reminders');await page.getByRole('switch',{name:'Daily hadith reminder'}).check();await page.getByRole('switch',{name:'Daily Quran reminder'}).check();await page.getByRole('switch',{name:'Prayer reminders'}).check();await page.getByLabel('Hadith reminder',{exact:true}).fill('09:00');await expect(page.locator('.reminder-time-pair')).toContainText('14:00');await page.getByRole('button',{name:/Save reminder preferences/}).click();await expect(page.getByRole('status')).toContainText('preferences are saved')
 await page.goto('account');await expect(page.locator('.data-inventory')).toContainText('Karachi, Pakistan')
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Export my data'}).click()]);expect(download.suggestedFilename()).toBe('riyad-my-data.json')
 const owner=await page.request.get(`${appOrigin}/api/admin/users`);expect(owner.status()).toBe(403)
 await page.locator('.delete-account > summary').click();await page.getByLabel('Current password',{exact:true}).fill(password);await page.getByLabel('Type DELETE to confirm').fill('DELETE');await page.getByRole('button',{name:'Delete my account permanently'}).click();await expect(page.getByRole('status')).toContainText('have been deleted')
})
test('private database and server configuration are blocked by the dev server',async({request})=>{
 for(const path of ['/.data/riyad.sqlite','/.data/auth-secret.json','/.data/vapid.json','/server/.env.local']){const r=await request.get(`${appOrigin}${path}`);expect([403,404]).toContain(r.status())}
})
test('new screens and floating navigation have usable Urdu layouts',async({page})=>{
 await page.setViewportSize({width:320,height:844});await page.goto('prayers');await page.getByRole('banner').getByRole('button',{name:'اردو (Urdu)',exact:true}).click()
 for(const path of ['prayers','quran','quran/1','account','reminders','privacy']){await page.goto(path);await page.waitForLoadState('networkidle');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),path).toBeLessThanOrEqual(1)}
 await expect(page.locator('.mobile-floating-navigation')).toBeVisible()
})
test('capture the new app screens',async({page})=>{
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('prayers');await page.getByRole('combobox',{name:'Or choose a city'}).selectOption({label:'Karachi, Pakistan'});await expect(page.locator('.prayer-time-list > div')).toHaveCount(6);await page.screenshot({path:resolve(screenshotDir,`riyad-prayers-${width}.png`),fullPage:true})
  await page.goto('quran/1');await expect(page.locator('.quran-ayah')).toHaveCount(7);await page.screenshot({path:resolve(screenshotDir,`riyad-quran-${width}.png`),fullPage:true})
  await page.goto('account');await expect(page.locator('.auth-form-panel')).toBeVisible();await page.screenshot({path:resolve(screenshotDir,`riyad-account-${width}.png`),fullPage:true})
  await page.goto('./');await expect(page.locator('.reading-path')).toHaveCount(6);await page.screenshot({path:resolve(screenshotDir,`riyad-home-with-navigation-${width}.png`),fullPage:true})
 }
})
