import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { DateTime } from 'luxon'
import { dailySchedule,calculatePrayerTimes } from './prayer.mjs'
test('Quran and hadith are five elapsed hours apart through DST and midnight',()=>{
 for(const [day,zone,time]of [['2026-03-08','America/New_York','00:30'],['2026-11-01','America/New_York','00:30'],['2026-10-22','Asia/Karachi','23:30']]){const x=dailySchedule(day,zone,time);assert.equal(x.ayah-x.hadith,5*3600000)}
})
test('prayer calculations use absolute instants, chosen school and timezone',()=>{
 const standard=calculatePrayerTimes({latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi',method:'Karachi',school:'standard',date:'2026-10-22'})
 const hanafi=calculatePrayerTimes({latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi',method:'Karachi',school:'hanafi',date:'2026-10-22'})
 const times=standard.rows.map(x=>Date.parse(x.time));assert.ok(times.every(Number.isFinite));assert.deepEqual([...times].sort((a,b)=>a-b),times)
 assert.ok(Date.parse(hanafi.rows.find(x=>x.name==='asr').time)>Date.parse(standard.rows.find(x=>x.name==='asr').time))
 assert.equal(standard.timezone,'Asia/Karachi');assert.throws(()=>calculatePrayerTimes({latitude:200,longitude:0,timezone:'UTC'}))
})
test('durable schedules deduplicate, retry without resending successful devices, and stop revoked reminders',async()=>{
 const dir=mkdtempSync(resolve(tmpdir(),'riyad-scheduler-'));process.env.RIYAD_SKIP_ENV_FILE='1';process.env.RIYAD_DATA_DIR=dir;process.env.APP_ORIGIN='http://127.0.0.1:8792'
 const {migrateAuth}=await import('./auth.mjs');await migrateAuth()
 const {run,all,get,db}=await import('./database.mjs');const {enqueueForUser,processJobs,validateSubscription}=await import('./push.mjs')
 const now=DateTime.fromISO('2026-10-22T09:00:00',{zone:'Asia/Karachi'}).toMillis()
 run('INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt,privacyAccepted) VALUES(?,?,?,?,?,?,?)','scheduler-user','Schedule test','schedule@example.test',1,now,now,1)
 run('INSERT INTO app_profiles(user_id,privacy_version,accepted_at,created_at) VALUES(?,?,?,?)','scheduler-user','2026-10-22-accounts-1',now,now)
 run('INSERT INTO app_reminders(user_id,hadith,ayah,prayers,vibration,hadith_time,timezone,method,school,updated_at) VALUES(?,1,1,0,1,?,?,?,?,?)','scheduler-user','09:00','Asia/Karachi','Karachi','hanafi',now)
 for(const id of ['device-one','device-two'])run('INSERT INTO app_push(id,user_id,endpoint,subscription,created_at) VALUES(?,?,?,?,?)',id,'scheduler-user',`https://fcm.googleapis.com/fcm/send/${id}`,'{}',now)
 enqueueForUser('scheduler-user',now);const count=get('SELECT count(*) AS n FROM app_jobs').n;enqueueForUser('scheduler-user',now);assert.equal(get('SELECT count(*) AS n FROM app_jobs').n,count)
 const calls=[]
 await processJobs(now,async subscription=>{calls.push(subscription.id);if(subscription.id==='device-two')throw new Error('temporary provider failure')})
 const due=get('SELECT * FROM app_jobs WHERE due_at=?',now);assert.equal(due.status,'processing')
 await processJobs(now+61000,async subscription=>{calls.push(subscription.id)})
 assert.equal(calls.filter(x=>x==='device-one').length,1);assert.equal(calls.filter(x=>x==='device-two').length,2);assert.equal(get('SELECT status FROM app_jobs WHERE id=?',due.id).status,'sent')
 run('UPDATE app_reminders SET ayah=0 WHERE user_id=?','scheduler-user');const before=calls.length;await processJobs(now+5*3600000,async x=>calls.push(x.id));assert.equal(calls.length,before)
 assert.throws(()=>validateSubscription({endpoint:'https://private.attacker.test/steal',keys:{}}))
 db.close();rmSync(dir,{recursive:true,force:true})
})
