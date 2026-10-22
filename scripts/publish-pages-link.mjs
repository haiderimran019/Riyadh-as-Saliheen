import {mkdirSync,rmSync,writeFileSync} from 'node:fs'

const origin='https://riyad-as-salihin.vercel.app',prefix='/Riyadh-as-Saliheen'
// The old public address forwards reading deep links to the full backend host.
// No account credentials, database files or deployment secrets enter this output.
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true})
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Riyad as-Salihin</title><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${origin}/"><link rel="canonical" href="${origin}/"><style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#f5f3eb;color:#183e30;font:18px Georgia,serif;text-align:center;padding:24px}a{color:inherit}</style></head><body><h1>Riyad as-Salihin</h1><p>Opening your reading space…</p><p><a href="${origin}/">Continue to Riyad as-Salihin</a></p><script>const prefix=${JSON.stringify(prefix)};const path=location.pathname===prefix?'/':location.pathname.startsWith(prefix+'/')?location.pathname.slice(prefix.length):'/';location.replace(${JSON.stringify(origin)}+path+location.search+location.hash);</script></body></html>`
for(const name of ['index.html','404.html'])writeFileSync(`dist/${name}`,html)
writeFileSync('dist/.nojekyll','')
console.log('Published forwarding pages to the full public Riyad service.')
