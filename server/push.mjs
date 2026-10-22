import webpush from 'web-push'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import { existsSync,readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config,privateFile } from './config.mjs'
import { all,get,run,preferences,locationFor } from './database.mjs'
import { dailySchedule,calculatePrayerTimes } from './prayer.mjs'
const keys=privateFile('vapid.json',()=>webpush.generateVAPIDKeys())
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://example.com/riyad/local-development',keys.publicKey,keys.privateKey)
export const pushPublicKey=keys.publicKey
const hosts=['fcm.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com','wns.windows.com','notify.windows.com']
export function validateSubscription(value) {
  if(typeof value?.endpoint!=='string')throw new Error('Invalid push subscription.')
  let endpoint
  try{endpoint=new URL(value.endpoint)}catch{throw new Error('Invalid push subscription.')}
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.port||!hosts.some(x=>endpoint.hostname===x||(['push.services.mozilla.com','web.push.apple.com','notify.windows.com','wns.windows.com'].includes(x)&&endpoint.hostname.endsWith(`.${x}`)))||value.endpoint.length>2048)throw new Error('This push service is not supported.')
  const {p256dh,auth}=value?.keys||{}
  if(typeof p256dh!=='string'||typeof auth!=='string'||!/^[A-Za-z0-9_-]+={0,2}$/.test(p256dh)||!/^[A-Za-z0-9_-]+={0,2}$/.test(auth)||Buffer.from(p256dh,'base64url').length!==65||Buffer.from(auth,'base64url').length!==16)throw new Error('Invalid device notification keys.')
  return {endpoint:endpoint.toString(),keys:{p256dh,auth},expirationTime:null}
}
let readingReferences=null,quranChapters=null
function content(kind,day) {
  const number=Math.abs(Math.floor(DateTime.fromISO(day,{zone:'UTC'}).toMillis()/86400000))
  if(kind==='hadith') {
    const path=resolve(config.contentDir,'riyad-as-salihin/all.json')
    if(existsSync(path)) { if(!readingReferences)readingReferences=JSON.parse(readFileSync(path,'utf8')).records.map(x=>({id:x.id,chapter:x.chapter}));const x=readingReferences[number%readingReferences.length];return {title:'Your daily hadith',body:'A moment with Riyad as-Salihin is ready. Open the full narration and its source.',url:`/collection/riyad-as-salihin/chapter/${x.chapter}?hadith=${encodeURIComponent(x.id)}#${x.id}`} }
    return {title:'Your daily hadith',body:'Make a little time for today’s reading.',url:'/'}
  }
  const indexPath=resolve(config.contentDir,'quran/index.json');if(!quranChapters&&existsSync(indexPath))quranChapters=JSON.parse(readFileSync(indexPath,'utf8')).chapters
  let surah=1,ayah=1,offset=number%6236;for(const chapter of quranChapters||[]){if(offset<chapter.count){surah=chapter.id;ayah=offset+1;break}offset-=chapter.count}
  return {title:'Your daily Quran ayah',body:`Take a moment to reflect on Qur’an ${surah}:${ayah}, with English translation.`,url:`/quran/${surah}?ayah=${ayah}`}
}
export function enqueueForUser(userId,now=Date.now()) {
  const p=preferences(userId),location=locationFor(userId)
  if(!all('SELECT id FROM app_push WHERE user_id=?',userId).length)return
  if(!get('SELECT u.id FROM user u JOIN app_profiles p ON p.user_id=u.id WHERE u.id=? AND u.emailVerified=1 AND p.privacy_version=?',userId,config.privacyVersion))return
  for(let offset=-1;offset<=2;offset++) {
    const day=DateTime.fromMillis(now,{zone:p.timezone}).plus({days:offset}).toISODate()
    const schedule=dailySchedule(day,p.timezone,p.hadithTime)
    for(const kind of ['hadith','ayah'])if(p[kind])insertJob(userId,kind,schedule[kind],{...content(kind,day),vibration:p.vibration,tag:`${kind}-${day}`},now)
    if(p.prayers&&location) {
      const prayerDay=DateTime.fromMillis(now,{zone:location.timezone}).plus({days:offset}).toISODate()
      const times=calculatePrayerTimes({...location,method:p.method,school:p.school,date:prayerDay})
      for(const row of times.rows.filter(x=>x.name!=='sunrise'&&x.time))insertJob(userId,`prayer:${row.name}`,Date.parse(row.time),{title:`${row.name[0].toUpperCase()+row.name.slice(1)} prayer time`,body:`Prayer time for ${location.label || 'your saved location'}.`,url:'/prayers',vibration:p.vibration,tag:`prayer-${prayerDay}-${row.name}`},now)
    }
  }
}
function insertJob(userId,kind,due,payload,now) { if(due<now-15*60000||due>now+3*86400000)return;run('INSERT OR IGNORE INTO app_jobs(id,user_id,kind,due_at,payload,created_at) VALUES(?,?,?,?,?,?)',randomUUID(),userId,kind,due,JSON.stringify(payload),now) }
export function resetSchedule(userId) { run("DELETE FROM app_jobs WHERE user_id=? AND status='pending'",userId);enqueueForUser(userId) }
export async function sendToSubscription(subscription,payload) { return webpush.sendNotification(JSON.parse(subscription.subscription),JSON.stringify(payload),{TTL:payload.tag?.startsWith('prayer-')?120:3600,urgency:'normal',timeout:10000}) }
let active=false,lastPlanning=0
export async function processJobs(now=Date.now(),send=sendToSubscription) {
  if(active)return;active=true
  try {
    if(now-lastPlanning>30*60000){for(const row of all('SELECT user_id FROM app_reminders'))enqueueForUser(row.user_id,now);lastPlanning=now}
    run("UPDATE app_jobs SET status='expired' WHERE status IN ('pending','processing') AND due_at<?",now-15*60000)
    const jobs=all("SELECT * FROM app_jobs WHERE due_at<=? AND attempts<3 AND (status='pending' OR(status='processing' AND lease_until<?)) ORDER BY due_at LIMIT 30",now,now)
    for(const job of jobs) {
      const claimed=run("UPDATE app_jobs SET status='processing',lease_until=?,attempts=attempts+1 WHERE id=? AND(status='pending' OR(status='processing' AND lease_until<?))",now+60000,job.id,now)
      if(!Number(claimed.changes))continue
      const p=preferences(job.user_id),payload=JSON.parse(job.payload)
      if(get('SELECT privacy_version FROM app_profiles WHERE user_id=?',job.user_id)?.privacy_version!==config.privacyVersion){run("UPDATE app_jobs SET status='cancelled' WHERE id=?",job.id);continue}
      if(!(job.kind.startsWith('prayer:')?p.prayers:p[job.kind])){run("UPDATE app_jobs SET status='cancelled' WHERE id=?",job.id);continue}
      let failed=false
      for(const subscription of all('SELECT * FROM app_push WHERE user_id=?',job.user_id)) {
        if(get('SELECT delivered_at FROM app_deliveries WHERE job_id=? AND subscription_id=?',job.id,subscription.id)?.delivered_at)continue
        try {
          await send(subscription,payload)
          run('INSERT INTO app_deliveries(job_id,subscription_id,delivered_at,attempts) VALUES(?,?,?,1) ON CONFLICT(job_id,subscription_id) DO UPDATE SET delivered_at=excluded.delivered_at,attempts=attempts+1',job.id,subscription.id,now)
        }catch(error){if([404,410].includes(error.statusCode))run('DELETE FROM app_push WHERE id=?',subscription.id);else failed=true}
      }
      run('UPDATE app_jobs SET status=?,lease_until=? WHERE id=?',failed?(job.attempts>=2?'failed':'processing'):'sent',failed?now+60000:0,job.id)
    }
    run("DELETE FROM app_jobs WHERE due_at<?",now-30*86400000)
  }finally{active=false}
}
