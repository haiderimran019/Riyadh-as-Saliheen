import { useEffect, useMemo, useState } from 'react'
import { getSetting, setSetting } from '../data/db'
import { useLocationData, prayerMethod } from '../services/LocationContext'
import { useAccount } from '../services/AccountContext'
import { api,jsonBody,dateInZone } from '../services/api'
import { calculatePrayerTimes, type PrayerResult } from '../../shared/prayer-times.mjs'

export function activePrayer(today: PrayerResult, yesterday: PrayerResult, tomorrow: PrayerResult, now: number) {
  const all = [...yesterday.rows,...today.rows,...tomorrow.rows].filter(x=>x.time).map(x=>({...x,at:Date.parse(x.time!)})).sort((a,b)=>a.at-b.at)
  const latest = all.filter(x=>x.at<=now).at(-1)
  const next = all.find(x=>x.at>now&&x.name!=='sunrise')
  if(latest?.name==='sunrise')return next?{...next,mode:'Next prayer',ends:null}:null
  return latest?{...latest,mode:'Current prayer',ends:all.find(x=>x.at>now)?.time||null}:null
}
export function usePrayer() {
  const {location} = useLocationData()
  const {account,refresh}=useAccount()
  const [school,setCurrentSchool] = useState<'standard'|'hanafi'>('hanafi'), [now,setNow]=useState(Date.now()),[loaded,setLoaded]=useState(false)
  useEffect(()=>{void getSetting('prayer-school','hanafi').then(x=>{setCurrentSchool(x==='hanafi'?'hanafi':'standard');setLoaded(true)});const id=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(id)},[])
  useEffect(()=>{if(account?.preferencesSaved){setCurrentSchool(account.preferences.school);void setSetting('prayer-school',account.preferences.school)}},[account?.preferences.school,account?.preferencesSaved])
  const zone=location?.timezone||'UTC',date=dateInZone(zone),method=prayerMethod(zone)
  const tables=useMemo(()=>{
    if(!location||!loaded)return null
    const input={latitude:location.latitude,longitude:location.longitude,timezone:zone,school,method}
    const day=new Date(`${date}T12:00:00Z`),before=new Date(day.getTime()-86400000).toISOString().slice(0,10),after=new Date(day.getTime()+86400000).toISOString().slice(0,10)
    return {today:calculatePrayerTimes({...input,date}),yesterday:calculatePrayerTimes({...input,date:before}),tomorrow:calculatePrayerTimes({...input,date:after})}
  },[location,loaded,zone,school,method,date])
  const current=tables?activePrayer(tables.today,tables.yesterday,tables.tomorrow,now):null
  const [schoolError,setSchoolError]=useState('')
  async function setSchool(value:'standard'|'hanafi'){
    setSchoolError('');setCurrentSchool(value);await setSetting('prayer-school',value)
    if(account?.preferencesSaved&&account.privacyVersion){try{await api('/account/reminders',{method:'PUT',body:jsonBody({...account.preferences,school:value,method,timezone:zone})});await refresh()}catch{setSchoolError('Prayer display updated. Reminder settings could not be saved; try again in Reminders.')}}
  }
  return {today:tables?.today||null,current,school,method,now,setSchool,schoolError}
}
