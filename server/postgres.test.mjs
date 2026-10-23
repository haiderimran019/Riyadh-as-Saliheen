import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,readdirSync,readFileSync,rmSync} from 'node:fs'
import {resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {randomBytes} from 'node:crypto'
import pg from 'pg'

// Explicit operator-run cloud check. Every write is isolated in a random schema.
test('Neon authentication, transactions, consent and cascading deletion',{timeout:90000},async t=>{
 process.loadEnvFile('.env.production.local')
 const direct=new URL(process.env.DATABASE_URL_UNPOOLED);direct.searchParams.set('sslmode','verify-full')
 const admin=new pg.Pool({connectionString:direct.href,ssl:{rejectUnauthorized:true}})
 const schema=`riyad_test_${randomBytes(8).toString('hex')}`,folder=mkdtempSync(resolve(tmpdir(),'riyad-pg-'))
 assert.match(schema,/^riyad_test_[a-f0-9]{16}$/)
 await admin.query(`CREATE SCHEMA "${schema}"`)
 let close=async()=>{}
 t.after(async()=>{await close();await admin.query(`DROP SCHEMA "${schema}" CASCADE`);await admin.end();rmSync(folder,{recursive:true,force:true})})
 delete process.env.VERCEL;delete process.env.RIYAD_SERVERLESS
 for(const key of Object.keys(process.env))if(key.startsWith('SMTP_'))delete process.env[key]
 process.env.DATABASE_URL=direct.href;process.env.RIYAD_DB_SCHEMA=schema;process.env.RIYAD_SKIP_ENV_FILE='1';process.env.RIYAD_DATA_DIR=folder;process.env.NODE_ENV='test';process.env.APP_ORIGIN='http://127.0.0.1:8794'
 const {auth,migrateAuth}=await import('./auth.mjs'),{db,get,run,transaction,closeDatabase}=await import('./database.mjs')
 close=closeDatabase
 assert.equal((await db.query('SELECT current_schema() AS name')).rows[0].name,schema)
 await migrateAuth()
 assert.equal((await get('SELECT version FROM app_schema WHERE id=1')).version,1)
 assert.equal((await get('SELECT version FROM app_schema WHERE id=2')).version,2)
 const password='Riyad-isolated-cloud-test-145!',email='cloud-reader@example.test'
 const created=await auth.api.signUpEmail({body:{name:'Cloud reader',email,password,privacyAccepted:true}})
 assert.equal(created.user.emailVerified,false)
 await assert.rejects(auth.api.signInEmail({body:{email,password}}),e=>e.body?.code==='EMAIL_NOT_VERIFIED')
 const messages=readdirSync(resolve(folder,'mail')).map(file=>JSON.parse(readFileSync(resolve(folder,'mail',file),'utf8')))
 const mail=messages.find(x=>x.to===email);assert.ok(mail)
 await auth.api.verifyEmail({query:{token:new URL(mail.url).searchParams.get('token')}})
 const login=await auth.api.signInEmail({body:{email,password},asResponse:true})
 assert.equal(login.status,200)
 const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');assert.ok(cookie)
 const user=await get('SELECT id,email,emailVerified FROM user WHERE email=?',email);assert.equal(user.emailVerified,true)
 assert.ok(await get("SELECT id FROM account WHERE userId=? AND providerId='credential'",user.id))
 const profile=await get('SELECT * FROM app_profiles WHERE user_id=?',user.id);assert.equal(profile.is_owner,0);assert.equal(profile.privacy_version,'2026-10-23-choice-3')
 const consent=await get('SELECT recorded_at FROM app_consents WHERE user_id=?',user.id);assert.ok(consent.recorded_at>1700000000000)
 await assert.rejects(transaction(async()=>{await run('UPDATE app_profiles SET is_owner=1 WHERE user_id=?',user.id);throw new Error('rollback fixture')}),/rollback fixture/)
 assert.equal((await get('SELECT is_owner FROM app_profiles WHERE user_id=?',user.id)).is_owner,0)
 await run('INSERT INTO app_locations(user_id,latitude,longitude,label,timezone,source,updated_at) VALUES(?,?,?,?,?,?,?)',user.id,24.861,67.001,'Test city','Asia/Karachi','manual',Date.now())
 const {setAnalytics,receiveUsage,usageInventory,usageSummary}=await import('./analytics.mjs')
 const payload={sessionId:'b0a2ad50-2012-4012-8012-001122334455',activeMs:0,timezone:'Asia/Karachi',language:'ar',events:[]}
 assert.equal(await receiveUsage(user.id,payload),false)
 await setAnalytics(user.id,true)
 await Promise.all([receiveUsage(user.id,payload),receiveUsage(user.id,payload)])
 assert.equal((await usageInventory(user.id)).sessions.length,1)
 assert.equal((await usageSummary(7,'Asia/Karachi')).readers,1)
 await setAnalytics(user.id,false)
 assert.equal((await usageInventory(user.id)).sessions.length,0)
 await auth.api.deleteUser({body:{password},headers:new Headers({Cookie:cookie})})
 assert.equal(await get('SELECT id FROM user WHERE id=?',user.id),undefined)
 assert.equal((await get('SELECT count(*) AS n FROM app_locations WHERE user_id=?',user.id)).n,0)
 assert.equal((await get('SELECT count(*) AS n FROM app_consents WHERE user_id=?',user.id)).n,0)
})
