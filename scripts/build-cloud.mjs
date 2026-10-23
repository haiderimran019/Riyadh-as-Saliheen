import {existsSync} from 'node:fs'
import {spawnSync} from 'node:child_process'

function command(program,args){
 const result=spawnSync(program,args,{stdio:'inherit',env:process.env})
 if(result.error)throw result.error
 if(result.status!==0)process.exit(result.status||1)
}
// Generated public text is intentionally excluded from Git. Fresh cloud builds
// import the same attributed editions as the public reading release.
for(const [file,script,args] of [
 ['riyad-as-salihin/index.json','data:import:riyad',['--languages=ar,en']],
 ['quran-of-day.json','data:import:quran-day',[]],
 ['translations/ur/riyad-as-salihin/all.json','data:import:urdu',[]],
 ['quran/index.json','data:import:quran',[]],
 ['quran/editions.json','data:import:quran-editions',[]],
])if(!existsSync(`data-local/generated/${file}`))command('npm',['run',script,'--',...args])
command('npm',['run','build:server'])
if(process.env.VERCEL_ENV==='production')command(process.execPath,['scripts/cloud-migrate.mjs'])
command('npx',['--no-install','nitro','build'])
for(const file of ['index.html','404.html','robots.txt','sitemap.xml'])if(existsSync(`.vercel/output/static/${file}`))throw new Error(`${file} must pass through the application server rather than a static development fallback.`)
