import { resolve } from 'node:path'
import { chmodSync } from 'node:fs'
import { AsyncLocalStorage } from 'node:async_hooks'
import { config } from './config.mjs'
export const postgres=Boolean(process.env.DATABASE_URL)
const context=new AsyncLocalStorage()
let sqliteQueue=Promise.resolve()
export const db=await (async()=>{
 if(postgres){
  const {default:pg}=await import('pg')
  pg.types.setTypeParser(20,value=>{const number=Number(value);if(!Number.isSafeInteger(number))throw new Error('Database integer exceeds safe precision.');return number})
  const url=new URL(process.env.DATABASE_URL);url.searchParams.set('sslmode','verify-full')
  const schema=process.env.RIYAD_DB_SCHEMA||'public';if(!/^(public|riyad_test_[a-f0-9]+)$/.test(schema))throw new Error('Invalid database schema.')
  // Neon's pooled endpoint rejects startup search_path options. Production uses
  // its default public schema; isolated tests use a direct connection/schema.
  const pool=new pg.Pool({connectionString:url.href,max:4,connectionTimeoutMillis:10000,idleTimeoutMillis:10000,...(schema==='public'?{}:{options:`-c search_path=${schema}`}),ssl:{rejectUnauthorized:true}})
  pool.on('error',()=>console.error('Database connection interrupted. A later request will reconnect.'))
  if(process.env.VERCEL){const {attachDatabasePool}=await import('@vercel/functions');attachDatabasePool(pool)}
  return pool
 }
 const {DatabaseSync}=await import('node:sqlite'),path=resolve(config.dataDir,'riyad.sqlite'),database=new DatabaseSync(path)
 chmodSync(path,0o600);database.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');return database
})()
function sqlForPostgres(sql){
 let query=sql.replace(/\b(FROM|JOIN|INTO|UPDATE|REFERENCES)\s+(user|session|account|verification)\b/gi,'$1 "$2"').replace(/\b(emailVerified|createdAt|updatedAt|expiresAt|userId|userAgent|providerId)\b/g,'"$1"').replace(/"emailVerified"\s*=\s*1/g,'"emailVerified"=true')
 let index=0,quoted=false,result=''
 for(let i=0;i<query.length;i++){const c=query[i];if(c==="'"){if(quoted&&query[i+1]==="'"){result+="''";i++;continue}quoted=!quoted}result+=c==='?'&&!quoted?`$${++index}`:c}
 return result
}
async function query(sql,args,kind){
 const client=context.getStore()
 if(postgres){const result=await (client||db).query(sqlForPostgres(sql),args);return kind==='run'?{changes:result.rowCount}:kind==='get'?result.rows[0]:result.rows}
 if(!client)await sqliteQueue
 return db.prepare(sql)[kind](...args)
}
export const get=(sql,...args)=>query(sql,args,'get')
export const all=(sql,...args)=>query(sql,args,'all')
export const run=(sql,...args)=>query(sql,args,'run')
export async function transaction(fn){
 if(context.getStore())return fn()
 if(postgres){const client=await db.connect();try{await client.query('BEGIN');const result=await context.run(client,fn);await client.query('COMMIT');return result}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}}
 let unlock;const previous=sqliteQueue;sqliteQueue=new Promise(resolve=>{unlock=resolve});await previous
 try{db.exec('BEGIN IMMEDIATE');const result=await context.run(db,fn);db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');throw error}finally{unlock()}
}
export async function migrateApplication(){
 const schema=`
    CREATE TABLE IF NOT EXISTS app_profiles (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, is_owner INTEGER NOT NULL DEFAULT 0, privacy_version TEXT NOT NULL DEFAULT '', accepted_at INTEGER, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_consents (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, purpose TEXT NOT NULL, granted INTEGER NOT NULL, version TEXT NOT NULL, recorded_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_locations (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, latitude REAL NOT NULL, longitude REAL NOT NULL, label TEXT NOT NULL, timezone TEXT NOT NULL, source TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_reminders (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, hadith INTEGER NOT NULL DEFAULT 0, ayah INTEGER NOT NULL DEFAULT 0, prayers INTEGER NOT NULL DEFAULT 0, vibration INTEGER NOT NULL DEFAULT 1, hadith_time TEXT NOT NULL DEFAULT '09:00', timezone TEXT NOT NULL DEFAULT 'UTC', method TEXT NOT NULL DEFAULT 'MuslimWorldLeague', school TEXT NOT NULL DEFAULT 'standard', updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_push (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, endpoint TEXT NOT NULL UNIQUE, subscription TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_jobs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, kind TEXT NOT NULL, due_at INTEGER NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, UNIQUE(user_id,kind,due_at));
    CREATE INDEX IF NOT EXISTS app_jobs_due ON app_jobs(status,due_at);
    CREATE TABLE IF NOT EXISTS app_deliveries (job_id TEXT NOT NULL REFERENCES app_jobs(id) ON DELETE CASCADE, subscription_id TEXT NOT NULL REFERENCES app_push(id) ON DELETE CASCADE, delivered_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(job_id,subscription_id));
    CREATE TABLE IF NOT EXISTS app_audit (id INTEGER PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, action TEXT NOT NULL, created_at INTEGER NOT NULL);

    CREATE TABLE IF NOT EXISTS app_location_details (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, precision TEXT NOT NULL DEFAULT 'approximate', accuracy REAL, live INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS app_analytics_consent (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, enabled INTEGER NOT NULL DEFAULT 0, version TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_usage_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, started_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, active_ms INTEGER NOT NULL DEFAULT 0, ended_at INTEGER, timezone TEXT NOT NULL, language TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS app_usage_user_time ON app_usage_sessions(user_id,started_at);
    CREATE TABLE IF NOT EXISTS app_usage_events (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, session_id TEXT NOT NULL REFERENCES app_usage_sessions(id) ON DELETE CASCADE, event_type TEXT NOT NULL, page TEXT NOT NULL, control TEXT NOT NULL, flow TEXT NOT NULL, occurred_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS app_usage_event_time ON app_usage_events(occurred_at);
    CREATE TABLE IF NOT EXISTS app_schema (id INTEGER PRIMARY KEY, version INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_workflows (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, generation TEXT NOT NULL, run_id TEXT, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL);
`
 if(postgres){
  const expected=process.env.RIYAD_DB_SCHEMA||'public',actual=(await db.query('SELECT current_schema() AS name')).rows[0].name
  if(actual!==expected)throw new Error('Refusing migration in an unexpected database schema.')
  const ddl=sqlForPostgres(schema).replace(/id INTEGER PRIMARY KEY/g,'id BIGSERIAL PRIMARY KEY').replace(/\bINTEGER\b/g,'BIGINT').replace(/\bREAL\b/g,'DOUBLE PRECISION')
  await db.query(ddl)
 }else db.exec(schema)
 // Preserve the v1 runtime probe while a rolling deployment serves both builds.
 // New capability rows are additive, so older cold starts keep working.
 await run('INSERT INTO app_schema(id,version) VALUES(1,1) ON CONFLICT(id) DO UPDATE SET version=excluded.version')
 await run('INSERT INTO app_schema(id,version) VALUES(2,2) ON CONFLICT(id) DO UPDATE SET version=excluded.version')
}
export async function assertSchema(){const row=await get('SELECT version FROM app_schema WHERE id=2');if(row?.version!==2)throw new Error('Apply the committed Riyad database migration before serving accounts.')}
export async function closeDatabase(){if(postgres)await db.end();else db.close()}
export const defaultPreferences=(timezone='UTC')=>({hadith:false,ayah:false,prayers:false,vibration:true,hadithTime:'09:00',timezone,method:'MuslimWorldLeague',school:'standard'})
export async function preferences(userId){const row=await get('SELECT * FROM app_reminders WHERE user_id=?',userId);return row?{hadith:!!row.hadith,ayah:!!row.ayah,prayers:!!row.prayers,vibration:!!row.vibration,hadithTime:row.hadith_time,timezone:row.timezone,method:row.method,school:row.school}:defaultPreferences()}
export async function locationFor(id){const x=await get('SELECT l.*,d.precision,d.accuracy,d.live FROM app_locations l LEFT JOIN app_location_details d ON d.user_id=l.user_id WHERE l.user_id=?',id);return x?{latitude:x.latitude,longitude:x.longitude,label:x.label,timezone:x.timezone,source:x.source,updatedAt:x.updated_at,precision:x.precision||'approximate',accuracy:x.accuracy,live:!!x.live}:null}
export async function recordConsent(userId,purpose,granted){await run('INSERT INTO app_consents(user_id,purpose,granted,version,recorded_at) VALUES(?,?,?,?,?)',userId,purpose,Number(granted),config.privacyVersion,Date.now())}
