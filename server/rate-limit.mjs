import {createHmac} from 'node:crypto'
import {isIP} from 'node:net'
import {authSecret,config} from './config.mjs'
import {get,run} from './database.mjs'
let cleanupAt=0
export async function limitRequest(req,max=200,window=60000){
 const forwarded=config.cloud?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():''
 const ip=isIP(forwarded)?forwarded:req.socket.remoteAddress||'local'
 const sensitive=/^\/auth\/(sign-in|sign-up|request-password-reset|send-verification-email)/.test(req.path)
 const path=sensitive?req.path:'all',now=Date.now(),bucket=createHmac('sha256',authSecret).update(`${ip}:${path}`).digest('hex')
 const row=await get('INSERT INTO app_rate_limits(bucket,count,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN app_rate_limits.resets_at<=? THEN 1 ELSE app_rate_limits.count+1 END,resets_at=CASE WHEN app_rate_limits.resets_at<=? THEN excluded.resets_at ELSE app_rate_limits.resets_at END RETURNING count,resets_at',bucket,now+window,now,now)
 if(now>cleanupAt){cleanupAt=now+3600000;await run('DELETE FROM app_rate_limits WHERE resets_at<?',now-86400000)}
 return row.count<=(sensitive?10:max)
}
export async function limitEmail(email){
 const now=Date.now(),key=createHmac('sha256',authSecret).update(`email:${email.trim().toLowerCase()}`).digest('hex')
 const row=await get('INSERT INTO app_rate_limits(bucket,count,resets_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN app_rate_limits.resets_at<=? THEN 1 ELSE app_rate_limits.count+1 END,resets_at=CASE WHEN app_rate_limits.resets_at<=? THEN excluded.resets_at ELSE app_rate_limits.resets_at END RETURNING count',key,now+15*60000,now,now)
 return row.count<=12
}
