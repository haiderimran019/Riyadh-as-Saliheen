import {randomUUID} from 'node:crypto'
import {config} from './config.mjs'
import {get,run,preferences} from './database.mjs'

export async function newScheduleGeneration(userId){
 const previous=await get('SELECT run_id FROM app_workflows WHERE user_id=?',userId)
 const generation=randomUUID()
 await run('INSERT INTO app_workflows(user_id,generation,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET generation=excluded.generation,run_id=NULL,updated_at=excluded.updated_at',userId,generation,Date.now())
 if(config.cloud&&previous?.run_id){
  try{const {getRun}=await import('workflow/api');await getRun(previous.run_id).cancel({cancelReason:'Reminder preferences changed'})}
  catch{console.warn('An older reminder run will stop when its next generation check occurs.')}
 }
 return generation
}
export async function startSchedule(userId,generation){
 if(!config.cloud)return
 const p=await preferences(userId)
 if(!p.hadith&&!p.ayah&&!p.prayers||!await get('SELECT id FROM app_push WHERE user_id=?',userId))return
 const {start}=await import('workflow/api'),{reminderCycle}=await import('../workflows/reminder-cycle.mjs')
 const launched=await start(reminderCycle,[userId,generation],{region:'sin1',experimental_retention:0})
 await run('UPDATE app_workflows SET run_id=?,updated_at=? WHERE user_id=? AND generation=?',launched.runId,Date.now(),userId,generation)
}
export async function reconcileSchedules(){
 await run('DELETE FROM app_rate_limits WHERE resets_at<?',Date.now())
 await run('DELETE FROM app_jobs WHERE due_at<?',Date.now()-30*86400000)
 const {all}=await import('./database.mjs'),{getRun}=await import('workflow/api')
 for(const row of await all('SELECT user_id FROM app_reminders WHERE hadith=1 OR ayah=1 OR prayers=1')){
  const record=await get('SELECT * FROM app_workflows WHERE user_id=?',row.user_id)
  let active=false
  if(record?.run_id){try{const status=await getRun(record.run_id).status;active=['pending','running'].includes(status)}catch{/* A missing/expired run is recreated below. */}}
  if(!active){const generation=await newScheduleGeneration(row.user_id);await startSchedule(row.user_id,generation)}
 }
}
