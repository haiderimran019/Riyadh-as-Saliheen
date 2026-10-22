import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { publicBoot, renderDocument } from '../server/public-render.mjs'
import { render } from '../.server-dist/entry-server.js'

const origin='https://haiderimran019.github.io',basePath='/Riyadh-as-Saliheen',contentDir=resolve('data-local/generated')
const template=readFileSync(resolve('dist/index.html'),'utf8')
const collection=JSON.parse(readFileSync(resolve(contentDir,'riyad-as-salihin/index.json'),'utf8'))
const quran=JSON.parse(readFileSync(resolve(contentDir,'quran/index.json'),'utf8'))
const publicRoutes=['/','/library','/quran','/prayers','/about','/sources','/privacy','/terms',...collection.chapters.map(x=>`/collection/riyad-as-salihin/chapter/${x.id}`),...quran.chapters.map(x=>`/quran/${x.id}`)]
const routes=[...publicRoutes,'/account','/admin','/reminders','/saved','/settings','/search','/feedback','/collection/riyad-as-salihin']
for(const route of routes){
  const data=publicBoot(route,{origin,basePath,contentDir,indexable:true})
  if(data.status!==200)throw new Error(`Cannot prerender ${route}`)
  const folder=resolve('dist',`.${route}`);mkdirSync(folder,{recursive:true})
  writeFileSync(resolve(folder,'index.html'),renderDocument(template,await render(route,data),data,'static-public-reading'))
}
const escape=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
writeFileSync(resolve('dist/sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map(route=>`<url><loc>${escape(`${origin}${basePath}${route==='/'?'/':`${route}/`}`)}</loc></url>`).join('')}</urlset>`)
writeFileSync(resolve('dist/robots.txt'),`User-agent: *\nAllow: ${basePath}/\n${['account','admin','reminders','saved','settings','search','feedback','api'].map(x=>`Disallow: ${basePath}/${x}`).join('\n')}\nSitemap: ${origin}${basePath}/sitemap.xml\n`)
writeFileSync(resolve('dist/.nojekyll'),'')
// GitHub Pages serves this client shell for URLs outside the known route folders.
writeFileSync(resolve('dist/404.html'),template)
console.log(`Prerendered ${routes.length} public reading and service-information pages. No account database or credentials are included.`)
