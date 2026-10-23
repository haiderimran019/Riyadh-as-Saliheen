import { auth } from './auth.mjs'
import { config } from './config.mjs'
import { get } from './database.mjs'
import { fromNodeHeaders } from 'better-auth/node'
import { existsSync,readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import express from 'express'
import { publicBoot,renderDocument,sitemap } from './public-render.mjs'
const publicPages=['/account','/privacy','/terms','/about','/sources']
export function attachProductionWeb(app,options){
 const template=readFileSync(resolve(process.env.VERCEL==='1'||process.env.RIYAD_SERVERLESS==='1'?'riyad-runtime/template.html':'dist/index.html'),'utf8'),entry=resolve('.server-dist/entry-server.js')
 if(!options.renderer&&!existsSync(entry))throw new Error('Build the server renderer with npm run build before starting production.')
 app.get('/robots.txt',(_req,res)=>{
  const rules=!options.indexable?'Disallow: /':config.requireGoogleSignIn?'Disallow: /\nAllow: /about$\nAllow: /sources$\nAllow: /privacy$\nAllow: /terms$':'Disallow: /api/\nDisallow: /admin\nDisallow: /account\nDisallow: /saved\nDisallow: /reminders\nDisallow: /settings\nDisallow: /search\nDisallow: /feedback'
  res.type('text/plain').send(`User-agent: *\n${rules}\nSitemap: ${options.origin}/sitemap.xml\n`)
 })
 app.get('/sitemap.xml',(_req,res)=>res.type('application/xml').send(sitemap({...options,requireGoogleSignIn:config.requireGoogleSignIn})))
 app.use(express.static(resolve('dist'),{dotfiles:'deny',index:false,setHeaders(res,path){if(path.includes('/assets/'))res.set('Cache-Control','public,max-age=31536000,immutable')}}))
 app.get('/{*path}',async(req,res,next)=>{try{
  if(req.path.includes('.')||req.url.length>4096)return res.status(404).type('text/plain').send('Not found')
  const data=publicBoot(req.url,{...options,capabilities:{...options.capabilities,requireGoogleSignIn:config.requireGoogleSignIn}})
  let authenticated=false
  if(data.status!==404&&config.requireGoogleSignIn&&!publicPages.includes(req.path.replace(/\/+$/,'')||'/')){
   const session=await auth.api.getSession({headers:fromNodeHeaders(req.headers)})
   authenticated=!!session?.user&&!!await get("SELECT id FROM account WHERE userId=? AND providerId='google'",session.user.id)
   if(!authenticated)return res.set({'Cache-Control':'no-store','X-Robots-Tag':'noindex,follow'}).redirect(302,`/account?returnTo=${encodeURIComponent(req.url)}`)
  }
  data.authenticated=authenticated
  const render=options.renderer||(await import(pathToFileURL(entry).href)).render
  res.set({'Cache-Control':'no-store','X-Robots-Tag':data.seo.robots}).status(data.status).type('html').send(renderDocument(template,await render(req.url,data),data,res.locals.nonce))
 }catch(error){next(error)}})
}
