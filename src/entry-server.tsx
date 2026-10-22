import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import { App } from './App'
import { BootProvider,type BootData } from './ssr/BootData'
export async function render(url:string,data:BootData):Promise<string>{
  // Each response is a complete document. Resolve lazy routes before emitting
  // HTML so no hidden Suspense chunks or inline swap scripts are required.
  const {prelude,postponed}=await prerenderToNodeStream(<StaticRouter basename={import.meta.env.BASE_URL} location={`${import.meta.env.BASE_URL.replace(/\/$/,'')}${url}`}><BootProvider data={data}><App/></BootProvider></StaticRouter>,{signal:AbortSignal.timeout(10000),progressiveChunkSize:Number.MAX_SAFE_INTEGER,onError(error){console.error('Public page rendering failed:',error instanceof Error?error.message:'render error')}})
  if(postponed)throw new Error('The server page did not finish rendering.')
  const chunks:Buffer[]=[]
  for await(const chunk of prelude)chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString()
}
