import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve} from 'node:path'
import {JSDOM} from 'jsdom'
import {publicBoot,renderDocument,sitemap} from './public-render.mjs'
test('public render serialization escapes script injection and sitemap excludes private routes',()=>{
 const options={origin:'https://riyad.example.test',contentDir:resolve('data-local/generated'),indexable:true}
 const boot=publicBoot('/quran/2?ayah=255',options);assert.match(boot.seo.canonical,/quran\/2\?ayah=241$/);assert.equal(boot.quranSurah.result.length,286)
 boot.quranIndex.edition={...boot.quranIndex.edition,title:'</script><script>alert(1)</script>'}
 const html=renderDocument('<html><head></head><body><div><!--ssr-outlet--></div><!--ssr-data--></body></html>','<main>Reading</main>',boot,'test-nonce');assert.ok(!html.includes('</script><script>alert'));assert.ok(html.includes('\\u003c/script'))
 const xml=sitemap(options);assert.ok(xml.includes('/quran/114'));assert.ok(xml.includes('?hadith='));assert.ok(!xml.includes('/admin'));assert.equal(publicBoot('/unknown',options).status,404)
})
test('production server returns reading HTML without JavaScript and enforces security headers', {timeout:45000},async t=>{
 const dir=mkdtempSync(resolve(tmpdir(),'riyad-ssr-')),port=8793,base=`http://127.0.0.1:${port}`
 const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'production',RIYAD_SKIP_ENV_FILE:'1',RIYAD_DATA_DIR:dir,API_PORT:String(port),APP_ORIGIN:'https://riyad.example.test',SMTP_HOST:'127.0.0.1',SMTP_FROM:'test@example.test',VAPID_SUBJECT:'mailto:test@example.test'},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x)
 t.after(()=>{child.kill();setTimeout(()=>rmSync(dir,{recursive:true,force:true}),500).unref()})
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(`${base}/api/health`)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready,output)
 for(const [path,marker] of [['/','daily-hadith'],['/library','chapter-row'],['/quran','Al-Fatihah'],['/quran/1','quran-arabic'],['/collection/riyad-as-salihin/chapter/1','arabic-text'],['/account','account-form'],['/prayers','prayer-timetable'],['/reminders','account-invitation'],['/privacy','Privacy']]){
  const response=await fetch(`${base}${path}`),html=await response.text();assert.equal(response.status,200,`${path}: ${html.slice(0,300)} ${output}`);assert.ok(html.includes(marker),`${path} did not contain ${marker}`);assert.ok(html.includes('riyad-bootstrap'));assert.ok(html.includes('rel="canonical"'));assert.ok(!html.includes('<!--ssr-outlet-->'));assert.ok(!html.includes('auth-secret'));assert.match(response.headers.get('content-security-policy'),/script-src 'self' 'nonce-/);assert.equal(response.headers.get('x-frame-options'),'DENY');assert.equal(response.headers.get('cache-control'),'no-store')
 }
 const q=await(await fetch(`${base}/quran/1`)).text();assert.ok(q.includes('quran-translation'));assert.ok(q.includes('QuranEnc.com'))
 for(const [ayah,first,last,count] of [[255,241,260,20],[286,281,286,6]]){
  const path=`/quran/2?ayah=${ayah}`,html=await(await fetch(`${base}${path}`)).text(),document=new JSDOM(html).window.document
  const rows=[...document.querySelectorAll('.quran-ayah')],source=publicBoot(path,{origin:base,contentDir:resolve('data-local/generated')}).quranSurah
  assert.equal(rows.length,count);assert.equal(rows[0].id,`ayah-${first}`);assert.equal(rows.at(-1).id,`ayah-${last}`)
  for(const row of rows){const record=source.result.find(x=>x.aya===row.dataset.ayah);assert.equal(row.querySelector('.quran-arabic').textContent,record.arabic_text);assert.equal(row.querySelector('.quran-translation > p').textContent,record.translation)}
 }
 const hadithBoot=publicBoot('/collection/riyad-as-salihin/chapter/1',{origin:base,contentDir:resolve('data-local/generated')}),lastHadith=hadithBoot.chapter.records.at(-1)
 const hadithHtml=await(await fetch(`${base}/collection/riyad-as-salihin/chapter/1?hadith=${encodeURIComponent(lastHadith.id)}`)).text()
 assert.equal(new JSDOM(hadithHtml).window.document.querySelector('.arabic-text').textContent,lastHadith.arabic)
 for(const path of ['/','/quran/1','/reminders']){
  const html=await(await fetch(`${base}${path}`)).text()
  assert.ok(!html.includes('<!--$?-->'),`${path} must contain its completed server content`)
  assert.ok(!html.includes('id="S:'),`${path} must not rely on hidden streaming content`)
  assert.ok(!/<script>(?!<)/.test(html),`${path} must not contain nonce-less streaming scripts`)
 }
 for(const path of ['/does-not-exist','/.data/riyad.sqlite','/server/.env.local','/quran/115'])assert.equal((await fetch(`${base}${path}`)).status,404,path)
 assert.equal((await fetch(`${base}/api/admin/users`)).status,401)
 const privateHtml=await fetch(`${base}/account`);assert.match(privateHtml.headers.get('x-robots-tag'),/noindex/)
 const robots=await(await fetch(`${base}/robots.txt`)).text();assert.ok(robots.includes('Disallow: /admin'));assert.ok(robots.includes('Sitemap: https://riyad.example.test/sitemap.xml'))
 const xml=await(await fetch(`${base}/sitemap.xml`)).text();assert.ok(xml.includes('/quran/114'))
 assert.equal((await fetch(`${base}/api/prayers`,{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'})).status,403)
 const oversized=await fetch(`${base}/api/prayers`,{method:'POST',headers:{Origin:'https://riyad.example.test','Content-Type':'application/json'},body:JSON.stringify({padding:'a'.repeat(34000)})});assert.equal(oversized.status,413)
})
