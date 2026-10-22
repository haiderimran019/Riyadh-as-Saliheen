import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
if(existsSync('server/.env.local'))process.loadEnvFile('server/.env.local')
const port=process.env.UI_PORT||'5173',apiPort=process.env.API_PORT||'8787'
const env={...process.env,APP_ORIGIN:process.env.APP_ORIGIN||`http://127.0.0.1:${port}`,API_PORT:apiPort,VITE_DATA_MODE:'real',VITE_BASE_PATH:'/'}
const children=[]
let stopped=false
function close(code=0){if(stopped)return;stopped=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),300).unref()}
const server=spawn(process.execPath,['server/index.mjs'],{env,stdio:'inherit'});children.push(server);server.on('exit',code=>close(code||0))
let ready=false
for(let i=0;i<60;i++){try{const response=await fetch(`http://127.0.0.1:${apiPort}/api/health`);if(response.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}
if(!ready){console.error('The account backend did not start. Check the server output above.');close(1)}else{const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port,'--strictPort'],{env,stdio:'inherit'});children.push(vite);vite.on('exit',code=>close(code||0))}
process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close())
