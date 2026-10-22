import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,readdirSync,statSync} from 'node:fs'
import {resolve} from 'node:path'
const read=file=>readFileSync(resolve('dist',file),'utf8')
test('Pages artifact contains readable routes, repository-scoped links and honest account availability',()=>{
 for(const [route,marker] of [['index.html','daily-hadith'],['library/index.html','chapter-row'],['quran/1/index.html','quran-translation'],['quran/114/index.html','quran-arabic'],['collection/riyad-as-salihin/chapter/364/index.html','arabic-text'],['prayers/index.html','prayer-timetable'],['privacy/index.html','GitHub Pages'],['account/index.html','account-service-notice']]){
  const html=read(route);assert.ok(html.includes(marker),route);assert.ok(!html.includes('<!--ssr-outlet-->'),route);assert.ok(html.includes('/Riyadh-as-Saliheen/assets/'),route);assert.ok(html.includes('href="/Riyadh-as-Saliheen/quran"'),route);assert.ok(html.includes('https://haiderimran019.github.io/Riyadh-as-Saliheen/'),route)
  const boot=JSON.parse(html.match(/<script id="riyad-bootstrap"[^>]*>([\s\S]*?)<\/script>/)[1]);assert.equal(boot.basePath,'/Riyadh-as-Saliheen');assert.equal(boot.status,200);assert.equal(boot.account,undefined);assert.equal(boot.user,undefined)
 }
 const account=read('account/index.html');assert.ok(!account.includes('class="account-form"'));assert.ok(account.includes('not hosted on this GitHub Pages website yet'))
 const xml=read('sitemap.xml');assert.ok(xml.includes('/Riyadh-as-Saliheen/quran/114/'));assert.ok(!xml.includes('/account'));assert.ok(!xml.includes('?ayah='));assert.ok(read('robots.txt').includes('Disallow: /Riyadh-as-Saliheen/admin'))
})
test('Pages output includes imported Quran and excludes private runtime files and credential material',()=>{
 let count=0
 const walk=folder=>{for(const item of readdirSync(folder)){const path=resolve(folder,item);if(statSync(path).isDirectory()){assert.ok(!['.data','server','node_modules','.git','.server-dist'].includes(item),path);walk(path)}else{assert.ok(!/\.sqlite|\.env|auth-secret|vapid\.json/.test(item),path);if(/\.(html|js|json)$/.test(item)){assert.ok(!/GOCSPX-|-----BEGIN .*PRIVATE KEY-----/.test(readFileSync(path,'utf8')),path);if(item==='index.html')count++}}}}
 walk(resolve('dist'));assert.equal(count,494);assert.equal(JSON.parse(read('data-local/generated/quran/index.json')).ayahCount,6236)
})
