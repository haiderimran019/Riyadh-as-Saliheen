import {defineNitroConfig} from 'nitro/config'
import {cpSync,mkdirSync,readdirSync,statSync} from 'node:fs'
import {resolve} from 'node:path'

export default defineNitroConfig({
 preset:'vercel',
 workflow:{dirs:['workflows','server'],runtime:'nodejs22.x',sourcemap:false,dashboard:false},
 modules:['workflow/nitro',(nitro)=>{
  nitro.hooks.hook('compiled',()=>{
   const roots=new Set([nitro.options.output.serverDir])
   const find=(folder:string)=>{for(const item of readdirSync(folder)){const path=resolve(folder,item);if(statSync(path).isDirectory()){if(item.endsWith('.func'))roots.add(path);else find(path)}}}
   find(resolve('.vercel/output/functions'))
   for(const root of roots){
    const runtime=resolve(root,'riyad-runtime');mkdirSync(runtime,{recursive:true})
    cpSync(resolve('dist/index.html'),resolve(runtime,'template.html'))
    for(const file of ['riyad-as-salihin','translations/en/riyad-as-salihin','quran','quran-of-day.json']){
     const destination=resolve(runtime,'content',file);mkdirSync(resolve(destination,'..'),{recursive:true});cpSync(resolve('data-local/generated',file),destination,{recursive:true})
    }
   }
  })
 }],
 routes:{'/**':{handler:'./server/cloud.mjs',format:'node'}},
 publicAssets:[{dir:resolve('dist'),ignore:['index.html','404.html'],maxAge:3600}],
 vercel:{entryFormat:'node',functions:{runtime:'nodejs22.x',regions:['sin1'],maxDuration:60},config:{version:3,crons:[{path:'/api/internal/reconcile',schedule:'15 0 * * *'}]}},
})
