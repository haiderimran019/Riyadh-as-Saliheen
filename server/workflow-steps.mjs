export async function nextReminder(userId,generation){
 'use step'
 const {get,preferences}=await import('./database.mjs')
 const current=await get('SELECT generation FROM app_workflows WHERE user_id=?',userId)
 if(current?.generation!==generation)return {stopped:true}
 const p=await preferences(userId)
 if(!p.hadith&&!p.ayah&&!p.prayers)return {stopped:true}
 if(!await get('SELECT id FROM app_push WHERE user_id=?',userId))return {stopped:true}
 const {enqueueForUser}=await import('./push.mjs'),now=Date.now()
 await enqueueForUser(userId,now)
 const job=await get("SELECT id,due_at,lease_until FROM app_jobs WHERE user_id=? AND attempts<3 AND status IN ('pending','processing') AND due_at>=? ORDER BY due_at LIMIT 1",userId,now-15*60000)
 return job?{at:Math.max(now,job.due_at,job.lease_until),jobId:job.id}:{at:now+12*3600000}
}
export async function dispatchReminder(userId,generation,jobId){
 'use step'
 const {get}=await import('./database.mjs')
 if((await get('SELECT generation FROM app_workflows WHERE user_id=?',userId))?.generation!==generation)return
 const job=await get('SELECT user_id FROM app_jobs WHERE id=?',jobId)
 if(job?.user_id!==userId)return
 const {processJobs}=await import('./push.mjs')
 await processJobs(Date.now(),undefined,userId)
}
