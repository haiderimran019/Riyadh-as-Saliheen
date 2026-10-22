import { StrictMode } from 'react'
import { createRoot,hydrateRoot } from 'react-dom/client'
import { BootProvider,readBootData } from './ssr/BootData'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { STATIC_READING } from './config'
import '@fontsource/noto-nastaliq-urdu/400.css'
import './styles.css'
import './features.css'

// A tab opened before a deployment can still reference the previous route
// bundles. Fetch the current server document instead of leaving a blank route.
let recoveringFromUpdate=false
window.addEventListener('vite:preloadError',event=>{
  event.preventDefault()
  if(recoveringFromUpdate)return
  recoveringFromUpdate=true
  window.location.reload()
})

const root=document.getElementById('root')!
const data=readBootData()
const app=<StrictMode><BrowserRouter basename={import.meta.env.BASE_URL}><BootProvider data={data}><App/></BootProvider></BrowserRouter></StrictMode>
if(data.pathname && root.children.length && !(STATIC_READING && window.location.search))hydrateRoot(root,app)
else createRoot(root).render(app)
