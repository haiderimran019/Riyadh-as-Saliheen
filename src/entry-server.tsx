import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { PassThrough } from 'node:stream'
import { App } from './App'
import { BootProvider,type BootData } from './ssr/BootData'
export function render(url:string,data:BootData):Promise<string>{return new Promise((resolve,reject)=>{
  const output=new PassThrough(),chunks:Buffer[]=[]
  output.on('data',chunk=>chunks.push(Buffer.from(chunk)));output.on('end',()=>resolve(Buffer.concat(chunks).toString()));output.on('error',reject)
  const timer=setTimeout(()=>{stream.abort();reject(new Error('Server rendering timed out.'))},10000)
  const stream=renderToPipeableStream(<StaticRouter location={url}><BootProvider data={data}><App/></BootProvider></StaticRouter>,{onAllReady(){clearTimeout(timer);stream.pipe(output)},onShellError(error){clearTimeout(timer);reject(error)},onError(error){console.error('Public page rendering failed:',error instanceof Error?error.message:'render error')}})
})}
