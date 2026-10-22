import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const folder=resolve('data-local/generated/quran');mkdirSync(folder,{recursive:true})
async function json(url) { for(let n=0;n<3;n++) { try { const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json() }catch(error){if(n===2)throw error;await new Promise(r=>setTimeout(r,1000*(n+1)))} } }
const editions=await json('https://quranenc.com/api/v1/translations/list/en?localization=en')
const list=Array.isArray(editions)?editions:editions.translations??editions.result
const edition=list.find(x=>x.key==='english_saheeh');if(!edition)throw new Error('The published English Saheeh edition was not found.')
const {chapters}=await json('https://api.quran.com/api/v4/chapters?language=en')
if(chapters.length!==114)throw new Error('Expected 114 source chapters.')
const metadata={publisher:'QuranEnc.com',sourceUrl:'https://quranenc.com/en/browse/english_saheeh',edition,dateRetrieved:new Date().toISOString(),chapterNamesSource:'https://api.quran.com/api/v4/chapters?language=en',chapters:chapters.map(x=>({id:x.id,name:x.name_simple,arabic:x.name_arabic,meaning:x.translated_name.name,count:x.verses_count}))}
const existing=existsSync(resolve(folder,'index.json'))?JSON.parse(readFileSync(resolve(folder,'index.json'),'utf8')):null
let next=0,total=0
async function worker() {
 while(next<chapters.length) {
  const chapter=chapters[next++],file=resolve(folder,`${chapter.id}.json`)
  let result
  if(existing?.edition.version===edition.version&&existsSync(file)) result=JSON.parse(readFileSync(file,'utf8')).result
  else { const value=await json(`https://quranenc.com/api/v1/translation/sura/english_saheeh/${chapter.id}`);result=value.result }
  if(result.length!==chapter.verses_count||result.some((x,i)=>Number(x.sura)!==chapter.id||Number(x.aya)!==i+1||!x.arabic_text||!x.translation))throw new Error(`Invalid source chapter ${chapter.id}`)
  writeFileSync(file,JSON.stringify({metadata:{publisher:metadata.publisher,sourceUrl:metadata.sourceUrl,edition,dateRetrieved:metadata.dateRetrieved},result}))
  total+=result.length
  if(chapter.id%20===0)console.log(`Imported through surah ${chapter.id}`)
  await new Promise(r=>setTimeout(r,180))
 }
}
await Promise.all([worker(),worker()])
if(total!==6236)throw new Error(`Expected 6236 ayahs, received ${total}`)
writeFileSync(resolve(folder,'index.json'),JSON.stringify({...metadata,ayahCount:total},null,2))
console.log(`Validated 114 surahs and ${total} Arabic ayahs with unmodified ${edition.title}, version ${edition.version}.`)
