import { existsSync,readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import express from 'express'
import { publicBoot,renderDocument,sitemap } from './public-render.mjs'
export function attachProductionWeb(app,options){
 const template=readFileSync(resolve('dist/index.html'),'utf8'),entry=resolve('.server-dist/entry-server.js')
 if(!existsSync(entry))throw new Error('Build the server renderer with npm run build before starting production.')
 app.get('/robots.txt',(_req,res)=>res.type('text/plain').send(`User-agent: *\n${options.indexable?'Disallow: /api/\nDisallow: /admin\nDisallow: /account\nDisallow: /saved\nDisallow: /reminders\nDisallow: /settings\nDisallow: /search\nDisallow: /feedback':'Disallow: /'}\nSitemap: ${options.origin}/sitemap.xml\n`))
 app.get('/sitemap.xml',(_req,res)=>res.type('application/xml').send(sitemap(options)))
 app.use(express.static(resolve('dist'),{dotfiles:'deny',index:false,setHeaders(res,path){if(path.includes('/assets/'))res.set('Cache-Control','public,max-age=31536000,immutable')}}))
 app.get('/{*path}',async(req,res,next)=>{try{if(req.path.includes('.')||req.url.length>4096)return res.status(404).type('text/plain').send('Not found');const data=publicBoot(req.url,options),{render}=await import(pathToFileURL(entry).href);res.set({'Cache-Control':'no-store','X-Robots-Tag':data.seo.robots}).status(data.status).type('html').send(renderDocument(template,await render(req.url,data),data,res.locals.nonce))}catch(error){next(error)}})
}
