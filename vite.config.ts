import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { randomBytes } from 'node:crypto'

export default defineConfig(({ mode,isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/hadith-reader/'
  const dataVersion = env.VITE_DATA_MODE === 'real' ? `Riyad ${new Date().toISOString().slice(0, 10)}` : 'Arabic text pending'

  return {
    // 1. Set the repository base path for Vite
    base: base,
    server: { fs: { deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.data/**','**/server/**','**/*.sqlite*','**/backend-test-data/**'] }, proxy: { '/api': { target: `http://127.0.0.1:${process.env.API_PORT || 8787}`, changeOrigin:false } } },
    build: { sourcemap:false },
    publicDir:isSsrBuild?false:'public',
    ssr:{noExternal:['lucide-react','react-router-dom','react-router'],resolve:{conditions:['module-sync','node','import','development|production']}},
    define: { __DATA_VERSION__: JSON.stringify(dataVersion) },
    plugins: [
      react(),
      {
        name:'riyad-public-ssr',
        configureServer(server){return ()=>{server.middlewares.use(async(req,res,next)=>{
          const url=req.originalUrl||req.url||'/'
          if(req.method!=='GET'||(!['/robots.txt','/sitemap.xml'].includes(url)&&url.split('?')[0].includes('.'))||url.startsWith('/api/')||url.startsWith('/@')||url.startsWith('/src/')||url.startsWith('/node_modules/'))return next()
          try{
            const {publicBoot,renderDocument,sitemap}=await import('./server/public-render.mjs')
            const capabilities=await fetch(`http://127.0.0.1:${process.env.API_PORT||8787}/api/health`).then(r=>r.json()).catch(()=>undefined)
            const options={origin:process.env.APP_ORIGIN||'http://127.0.0.1:5173',contentDir:resolve('data-local/generated'),indexable:false,capabilities}
            if(url==='/robots.txt'){res.setHeader('Content-Type','text/plain');return res.end('User-agent: *\nDisallow: /\n')}
            if(url==='/sitemap.xml'){res.setHeader('Content-Type','application/xml');return res.end(sitemap(options))}
            const data=publicBoot(url,options),template=await server.transformIndexHtml(url,readFileSync(resolve('index.html'),'utf8')),{render}=await server.ssrLoadModule('/src/entry-server.tsx')
            res.statusCode=data.status||200;res.setHeader('Content-Type','text/html');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex,follow');res.end(renderDocument(template,await render(url,data),data,randomBytes(18).toString('base64')))
          }catch(error){server.ssrFixStacktrace(error as Error);next(error)}
        })}}
      },
      {
        name: 'copy-local-real-data',
        closeBundle() {
          if (isSsrBuild || env.VITE_DATA_MODE !== 'real') return
          const source = resolve('data-local/generated')
          if (!existsSync(source)) throw new Error('Real mode requires data-local/generated. Run npm run data:import:riyad first.')
          for (const file of ['collections.json','sources.json','quran-of-day.json','riyad-as-salihin','quran','translations/en/riyad-as-salihin','translations/ur/riyad-as-salihin']) {
            const destination=resolve('dist/data-local/generated',file)
            if(!existsSync(resolve(source,file)))continue
            mkdirSync(resolve(destination,'..'),{recursive:true})
            cpSync(resolve(source,file),destination,{recursive:true})
          }
          copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
        },
      },
    ],
  }
})
