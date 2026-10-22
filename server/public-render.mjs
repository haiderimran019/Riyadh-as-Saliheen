import { readFileSync,existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { QURAN_PAGE_SIZE } from '../shared/reading-pages.mjs'
import { pageSeo } from '../shared/seo.mjs'
const cache=new Map()
function read(root,file){const path=resolve(root,file);if(!existsSync(path))return undefined;if(!cache.has(path))cache.set(path,JSON.parse(readFileSync(path,'utf8')));return cache.get(path)}
export function publicBoot(url,{origin,contentDir,capabilities,indexable=false,basePath='',now=new Date()}){
 const parsed=new URL(url,origin),pathname=parsed.pathname.replace(/\/+$/,'')||'/',data={basePath,pathname,now:now.toISOString(),origin,capabilities,status:200}
 data.collection=read(contentDir,'riyad-as-salihin/index.json');data.quranIndex=read(contentDir,'quran/index.json')
 const q=/^\/quran\/(\d+)$/.exec(pathname),chapter=/^\/collection\/riyad-as-salihin\/chapter\/(\d+)$/.exec(pathname)
 if(q){const id=Number(q[1]);if(id<1||id>114)data.status=404;else{data.quranSurah=read(contentDir,`quran/${id}.json`);if(!data.quranSurah)data.status=404}}
 else if(chapter){const item=data.collection?.chapters.find(x=>x.id===chapter[1]);if(item){data.chapterId=item.id;data.chapter=read(contentDir,`riyad-as-salihin/${item.file}`);data.translation=read(contentDir,`translations/en/riyad-as-salihin/${item.file}`);data.hadithId=parsed.searchParams.get('hadith')||data.chapter?.records[0]?.id;if(!data.chapter?.records.some(x=>x.id===data.hadithId))data.status=404}else data.status=404}
 else if(!['/','/library','/quran','/prayers','/about','/sources','/privacy','/terms','/account','/admin','/reminders','/saved','/settings','/search','/feedback','/collection/riyad-as-salihin'].includes(pathname))data.status=404
 if(pathname==='/'){
  const records=read(contentDir,'riyad-as-salihin/all.json')?.records||[],ids=data.collection?.recordIds||[],index=Math.floor(now.getTime()/(6*3600000)),id=ids[index%ids.length],record=records.find(x=>x.id===id)||records[index%records.length]
  if(record){data.dailyHadith={...record,collectionId:'riyad-as-salihin',chapterId:record.chapter};const item=data.collection.chapters.find(x=>x.id===record.chapter);if(item)data.dailyTranslation=read(contentDir,`translations/en/riyad-as-salihin/${item.file}`)}
  data.dailyQuran=read(contentDir,'quran-of-day.json')
 }
 data.seo=pageSeo(url,data,indexable);return data
}
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029')
export function renderDocument(template,markup,data,nonce){
 const seo=data.seo,image=new URL(`${data.basePath||''}/icons/icon-512.png`,data.origin).href
 const graph=[{'@type':'WebSite','@id':`${data.origin}${data.basePath||''}/#website`,name:'Riyad as-Salihin',url:`${data.origin}${data.basePath||''}/`,inLanguage:['en','ar']},{'@type':'WebPage',name:seo.title,description:seo.description,url:seo.canonical,isPartOf:{'@id':`${data.origin}${data.basePath||''}/#website`}}]
 if(data.chapter)graph.push({'@type':'Book',name:'Riyad as-Salihin',author:{'@type':'Person',name:'Imam al-Nawawi'},inLanguage:['ar','en'],isBasedOn:'https://riyadh.islamenc.com/en',url:seo.canonical})
 let html=template.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta\s+(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*\/>/g,'')
 const head=`<title>${escape(seo.title)}</title><meta name="description" content="${escape(seo.description)}"><meta name="robots" content="${seo.robots}"><link rel="canonical" href="${escape(seo.canonical)}"><meta property="og:title" content="${escape(seo.title)}"><meta property="og:description" content="${escape(seo.description)}"><meta property="og:url" content="${escape(seo.canonical)}"><meta property="og:type" content="website"><meta property="og:image" content="${escape(image)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(seo.title)}"><meta name="twitter:description" content="${escape(seo.description)}"><script id="riyad-structured-data" type="application/ld+json" nonce="${nonce}">${json({'@context':'https://schema.org','@graph':graph})}</script>`
 html=html.replace('</head>',`${head}</head>`).replace('<!--ssr-outlet-->',markup).replace('<!--ssr-data-->',`<script id="riyad-bootstrap" type="application/json" nonce="${nonce}">${json(data)}</script>`)
 return html
}
export function sitemap({origin,contentDir,basePath=''}){
 const paths=['/','/library','/quran','/prayers','/about','/sources','/privacy','/terms'],collection=read(contentDir,'riyad-as-salihin/index.json'),quran=read(contentDir,'quran/index.json')
 for(const chapter of collection?.chapters||[]){const path=`/collection/riyad-as-salihin/chapter/${chapter.id}`;paths.push(path);for(const record of read(contentDir,`riyad-as-salihin/${chapter.file}`)?.records||[])paths.push(`${path}?hadith=${encodeURIComponent(record.id)}`)}
 for(const surah of quran?.chapters||[])for(let ayah=1;ayah<=surah.count;ayah+=QURAN_PAGE_SIZE)paths.push(`/quran/${surah.id}${ayah>1?`?ayah=${ayah}`:''}`)
 return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${escape(new URL(`${basePath}${path}`,origin).href)}</loc></url>`).join('')}</urlset>`
}
