import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccount } from './AccountContext'
import { api, browserTimezone, jsonBody } from './api'
import { useI18n } from '../i18n'

export function analyticsPage(path: string) {
  if(path === '/')return 'home'
  if(path.startsWith('/collection/'))return 'hadith'
  const page=path.split('/')[1] || 'home'
  return ['quran','library','prayers','saved','search','settings','account','reminders','about','sources','privacy','terms','admin'].includes(page)?page:'home'
}
type Event = {id:string;type:string;page:string;control:string;flow:string}
const Context=createContext<{choice:(enabled:boolean)=>Promise<void>}>({choice:async()=>undefined})
export function AnalyticsProvider({children}:{children:ReactNode}) {
  const {account,refresh,capabilities}=useAccount(),{pathname}=useLocation(),{language,t}=useI18n()
  const [override,setOverride]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const languageRef=useRef(language);languageRef.current=language
  const page=useRef(analyticsPage(pathname));page.current=analyticsPage(pathname)
  const openFlows=useRef(new Set<string>())
  const session=useRef(''),events=useRef<Event[]>([]),activeMs=useRef(0),lastTick=useRef(0),lastActivity=useRef(0)
  const enabled=!!account?.analyticsEnabled&&(override??true)&&account.privacyVersion===capabilities?.privacyVersion
  const track=(type:string,control='',flow='')=>{if(enabled&&events.current.length<120)events.current.push({id:crypto.randomUUID(),type,page:page.current,control,flow})}
  const flush=useRef<(ended?:boolean)=>void>(()=>undefined)
  useEffect(()=>{setOverride(null)},[account?.user.id])
  useEffect(()=>{
    if(!enabled){events.current=[];session.current='';return}
    openFlows.current.clear();session.current=crypto.randomUUID();lastTick.current=performance.now();lastActivity.current=Date.now();activeMs.current=0
    const tick=()=>{const now=performance.now();if(document.visibilityState==='visible'&&Date.now()-lastActivity.current<60000)activeMs.current+=Math.min(now-lastTick.current,5000);lastTick.current=now}
    const send=(ended=false)=>{tick();if(!session.current)return;const payload={sessionId:session.current,activeMs:Math.min(60000,Math.round(activeMs.current)),ended,events:events.current.splice(0,30),timezone:browserTimezone(),language:languageRef.current};activeMs.current=0;void api('/usage',{method:'POST',body:jsonBody(payload),keepalive:true}).catch(()=>undefined)}
    flush.current=send
    const action=(event:globalThis.Event)=>{
      lastActivity.current=Date.now()
      if(!['click','change'].includes(event.type)||!(event.target instanceof Element))return
      const element=event.target.closest<HTMLElement>('button,a,select,input[type=checkbox]');if(!element)return
      if((element instanceof HTMLSelectElement||element instanceof HTMLInputElement)?event.type!=='change':event.type!=='click')return
      const explicit=element.dataset.track
      let control=explicit||''
      if(!control&&element instanceof HTMLAnchorElement&&element.getAttribute('href')?.startsWith('/'))control='navigation'
      if(control)track('control.click',control)
    }
    const flow=(event:globalThis.Event)=>{const value=(event as CustomEvent<{type:string;flow:string}>).detail;if(value.type==='flow.started'){if(openFlows.current.has(value.flow))return;openFlows.current.add(value.flow)}else{if(!openFlows.current.has(value.flow))return;openFlows.current.delete(value.flow)}track(value.type,'',value.flow)}
    const visibility=()=>{tick();if(document.visibilityState==='hidden')send(false);else lastActivity.current=Date.now()}
    const end=()=>send(true)
    document.addEventListener('change',action);document.addEventListener('click',action);document.addEventListener('keydown',action);document.addEventListener('scroll',action,{passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',end);window.addEventListener('riyad-usage-flow',flow)
    const timer=setInterval(send,15000),clock=setInterval(tick,1000)
    send()
    return()=>{send(true);clearInterval(timer);clearInterval(clock);document.removeEventListener('change',action);document.removeEventListener('click',action);document.removeEventListener('keydown',action);document.removeEventListener('scroll',action);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',end);window.removeEventListener('riyad-usage-flow',flow)}
  },[enabled,account?.user.id])
  useEffect(()=>{if(enabled){track('page.view');flush.current()}},[pathname,enabled])
  async function choice(value:boolean){setOverride(false);setBusy(true);setError('');try{await api('/account/analytics',{method:'PUT',body:jsonBody({enabled:value})});await refresh();setOverride(value)}catch{setError(t('Your choice could not be saved. Please try again.'))}finally{setBusy(false)}}
  const prompt=account&&!account.analyticsChoiceMade&&account.privacyVersion===capabilities?.privacyVersion
  return <Context.Provider value={{choice}}>{children}{prompt&&<aside className="usage-choice" aria-label={t('Optional usage analytics')}><div><strong>{t('Help shape a better Riyad')}</strong><p>{t('Allow the owner to see your app sessions, feature clicks and task completion. No verse numbers, search words or location enter analytics. You can decline and keep using the app.')}</p>{error&&<p role="alert">{error}</p>}</div><div><button className="outlined-action" disabled={busy} onClick={()=>void choice(false)}>{t('No thanks')}</button><button className="primary-action" disabled={busy} onClick={()=>void choice(true)}>{t('Allow analytics')}</button></div></aside>}</Context.Provider>
}
export const useAnalyticsChoice=()=>useContext(Context)
export function trackFlow(type:'flow.started'|'flow.completed'|'flow.skipped',flow:'location'|'reminders'|'reading_settings'){window.dispatchEvent(new CustomEvent('riyad-usage-flow',{detail:{type,flow}}))}
