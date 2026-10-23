import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getSetting, setSetting } from '../data/db'
import { api, browserTimezone, jsonBody, type SavedLocation } from './api'
import { trackFlow } from './AnalyticsContext'
import { useAccount } from './AccountContext'

export const cities = [
  {label:'Karachi, Pakistan',latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi'},
  {label:'Islamabad, Pakistan',latitude:33.6844,longitude:73.0479,timezone:'Asia/Karachi'},
  {label:'Lahore, Pakistan',latitude:31.5204,longitude:74.3587,timezone:'Asia/Karachi'},
  {label:'Dhaka, Bangladesh',latitude:23.8103,longitude:90.4125,timezone:'Asia/Dhaka'},
  {label:'Makkah, Saudi Arabia',latitude:21.4225,longitude:39.8262,timezone:'Asia/Riyadh'},
  {label:'Dubai, UAE',latitude:25.2048,longitude:55.2708,timezone:'Asia/Dubai'},
  {label:'London, UK',latitude:51.5074,longitude:-0.1278,timezone:'Europe/London'},
  {label:'New York, USA',latitude:40.7128,longitude:-74.006,timezone:'America/New_York'},
  {label:'Kuala Lumpur, Malaysia',latitude:3.139,longitude:101.6869,timezone:'Asia/Kuala_Lumpur'},
]
export function prayerMethod(zone: string) {
  if (/Karachi|Dhaka|Kolkata/.test(zone)) return 'Karachi'
  if (/Riyadh/.test(zone)) return 'UmmAlQura'
  if (/Dubai/.test(zone)) return 'Dubai'
  if (/Kuala_Lumpur|Singapore/.test(zone)) return 'Singapore'
  if (/America\//.test(zone)) return 'NorthAmerica'
  if (/Cairo/.test(zone)) return 'Egyptian'
  if (/Istanbul/.test(zone)) return 'Turkey'
  return 'MuslimWorldLeague'
}
type Value = { location: SavedLocation|null; locating: boolean; live: boolean; error: string; locate: () => void; stop: () => void; choose: (value: SavedLocation) => Promise<void>; clear: () => void; shareLatest: (precise: boolean) => Promise<void> }
const Context = createContext<Value|null>(null)

export function LocationProvider({children}: {children: ReactNode}) {
  const {account,refresh} = useAccount()
  const [location,setLocation] = useState<SavedLocation|null>(null)
  const [locating,setLocating] = useState(false), [live,setLive] = useState(false), [error,setError] = useState('')
  const watch = useRef<number|null>(null), active = useRef(false), requestId = useRef(0), lastShared = useRef(0), sharingFor = useRef('')
  const accountRef = useRef(account); accountRef.current = account
  const latestFix=useRef(0), awaitingFix=useRef(false), previousAccount=useRef(account?.user.id)
  const stop = useCallback(() => {
    active.current = false; sharingFor.current=''; requestId.current++
    if (watch.current !== null) navigator.geolocation?.clearWatch(watch.current)
    watch.current = null; setLive(false); setLocating(false);setError('')
    void setSetting('prayer-live-location',false)
  }, [])
  const choose = useCallback(async(value: SavedLocation) => { setLocation(value); await setSetting('prayer-location',JSON.stringify(value)) }, [])
  const persistShared = useCallback(async(value: SavedLocation) => {
    await api('/account/location',{method:'PUT',body:jsonBody({...value,updatedAt:undefined,accuracy:value.accuracy??undefined,precision:'precise',live:true,consent:true,preciseConsent:true,liveUpdate:true})})
  }, [])
  const begin = useCallback(() => {
    if (!navigator.geolocation) { setError('Location is not supported in this browser.'); return }
    active.current = true; setLocating(true); setError(''); setLive(true)
    const generation = ++requestId.current
    const success = async(position: GeolocationPosition) => {
      if (!active.current || generation !== requestId.current || position.timestamp < latestFix.current) return
      latestFix.current=position.timestamp
      const {latitude,longitude,accuracy} = position.coords
      let timezone = browserTimezone()
      try { timezone = (await import('tz-lookup')).default(latitude,longitude) } catch { /* Keep the device timezone if offline lookup is unavailable. */ }
      if (!active.current || generation !== requestId.current || position.timestamp < latestFix.current) return
      const value: SavedLocation = {latitude,longitude,accuracy,timezone,label:'Current location',source:'gps',updatedAt:position.timestamp,precision:'precise',live:true}
      await choose(value); if(awaitingFix.current){trackFlow('flow.completed','location');awaitingFix.current=false;} setLocating(false); setError(''); void setSetting('prayer-live-location',true)
      if (sharingFor.current === accountRef.current?.user.id && Date.now()-lastShared.current > 60000) {
        lastShared.current = Date.now()
        void persistShared(value).catch(() => setError('Your GPS works, but sharing the latest fix failed. Try saving it again.'))
      }
    }
    const failure = (reason: GeolocationPositionError) => {
      if (!active.current || generation !== requestId.current) return
      setLocating(false)
      if(reason.code===1)stop()
      setError(reason.code===1?'Allow location access in your browser and device settings, then try again.':reason.code===3?'GPS is taking longer than usual. Keep this page open; it will update when a fix arrives.':'Your device cannot provide a location yet. Check its location services and try again.')
    }
    // A quick cached/network fix can succeed where high-accuracy GPS is slow.
    navigator.geolocation.getCurrentPosition(p=>void success(p),()=>undefined,{enableHighAccuracy:false,timeout:8000,maximumAge:60000})
    watch.current = navigator.geolocation.watchPosition(p=>void success(p),failure,{enableHighAccuracy:true,timeout:30000,maximumAge:15000})
  }, [choose,persistShared,stop])
  const locate = useCallback(() => { stop();awaitingFix.current=true;trackFlow('flow.started','location'); begin() }, [stop,begin])
  useEffect(() => {
    let mounted=true
    void getSetting('prayer-location','').then(value=>{if(mounted&&value&&!active.current){try{setLocation(JSON.parse(String(value)))}catch{}}}).catch(()=>undefined)
    // Reuse an existing grant, never trigger a permission popup automatically.
    void getSetting('prayer-live-location',false).then(async enabled=>{if(!enabled||!navigator.permissions)return;const permission=await navigator.permissions.query({name:'geolocation'});if(mounted&&permission.state==='granted'&&document.visibilityState==='visible')begin()}).catch(()=>undefined)
    const visibility=()=>{if(document.visibilityState==='hidden'){if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);watch.current=null;requestId.current++}else if(active.current)begin()}
    document.addEventListener('visibilitychange',visibility)
    return()=>{mounted=false;active.current=false;requestId.current++;if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);document.removeEventListener('visibilitychange',visibility)}
  },[begin])
  useEffect(()=>{sharingFor.current='';lastShared.current=0;if(previousAccount.current&&previousAccount.current!==account?.user.id)stop();previousAccount.current=account?.user.id},[account?.user.id,stop])
  useEffect(()=>{if(!account?.location||account.location.precision!=='precise')sharingFor.current=''},[account?.location])
  async function shareLatest(precise: boolean) {
    if(!location||!account)return
    await api('/account/location',{method:'PUT',body:jsonBody({...location,updatedAt:undefined,accuracy:precise?(location.accuracy??undefined):undefined,precision:precise?'precise':'approximate',live:precise&&live,consent:true,preciseConsent:precise})})
    sharingFor.current = precise&&live?account.user.id:'';lastShared.current=Date.now();await refresh()
  }
  return <Context.Provider value={{location,locating,live,error,locate,stop,choose:async value=>{stop();setError('');await choose(value)},clear:()=>{stop();sharingFor.current='';setLocation(null);void setSetting('prayer-location','')},shareLatest}}>{children}</Context.Provider>
}
export function useLocationData(){const value=useContext(Context);if(!value)throw new Error('Location provider missing.');return value}
