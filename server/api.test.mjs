import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync,readdirSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'

test('real authentication, consent, owner exports and account isolation', {timeout:60000}, async t=>{
 const dataDir=mkdtempSync(resolve(tmpdir(),'riyad-api-')),port=8791,origin=`http://127.0.0.1:${port}`
 const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,RIYAD_SKIP_ENV_FILE:'1',RIYAD_DATA_DIR:dataDir,APP_ORIGIN:origin,API_PORT:String(port),RIYAD_OWNER_EMAIL:'owner@example.test',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']})
 let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x)
 t.after(()=>{child.kill('SIGTERM');setTimeout(()=>rmSync(dataDir,{recursive:true,force:true}),300).unref()})
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(`${origin}/api/health`);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready,output)
 async function request(path,{body,method='GET',cookie='',requestOrigin=origin}={}){const response=await fetch(`${origin}/api${path}`,{method,headers:{Origin:requestOrigin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});const value=await response.json().catch(()=>null);const cookies=response.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');return {response,value,cookie:cookies}}
 const password='Example-test-password-145!'
 const rejected=await request('/auth/sign-up/email',{method:'POST',body:{name:'No consent',email:'no-consent@example.test',password,privacyAccepted:false}});assert.equal(rejected.response.status,400)
 async function create(email,name){const signup=await request('/auth/sign-up/email',{method:'POST',body:{name,email,password,privacyAccepted:true,callbackURL:`${origin}/account`}});assert.equal(signup.response.status,200);const before=await request('/auth/sign-in/email',{method:'POST',body:{email,password}});assert.equal(before.response.status,403)
  let mail;for(let i=0;i<20;i++){const files=readdirSync(resolve(dataDir,'mail')).map(x=>JSON.parse(readFileSync(resolve(dataDir,'mail',x),'utf8')));mail=files.find(x=>x.to===email);if(mail)break;await new Promise(r=>setTimeout(r,50))}assert.ok(mail)
  const verified=await fetch(mail.url,{redirect:'manual'});assert.ok([200,302,303].includes(verified.status))
  const login=await request('/auth/sign-in/email',{method:'POST',body:{email,password}});assert.equal(login.response.status,200);assert.ok(login.cookie);assert.match(login.response.headers.get('set-cookie'),/httponly/i);return login.cookie
 }
 const ownerCookie=await create('owner@example.test','=Owner test')
 assert.equal((await request('/account')).response.status,401)
 assert.equal((await request('/admin/users',{cookie:ownerCookie})).response.status,403)
 const missingConsent=await request('/account/location',{cookie:ownerCookie,method:'PUT',body:{latitude:24.86073456,longitude:67.00112345,label:'Karachi',timezone:'Asia/Karachi',source:'gps'}});assert.equal(missingConsent.response.status,400)
 const location=await request('/account/location',{cookie:ownerCookie,method:'PUT',body:{latitude:24.86073456,longitude:67.00112345,label:'Karachi',timezone:'Asia/Karachi',source:'gps',consent:true}});assert.equal(location.response.status,200);assert.equal(location.value.location.latitude,24.861)
 const csrf=await request('/account/location',{cookie:ownerCookie,method:'DELETE',requestOrigin:'https://attacker.example'});assert.equal(csrf.response.status,403)
 const otherCookie=await create('reader@example.test','Another reader')
 assert.equal((await request('/account',{cookie:otherCookie})).value.location,null)
 const userExport=await request('/account/export',{cookie:ownerCookie});assert.equal(userExport.response.status,200);assert.equal(userExport.value.profile.email,'owner@example.test');assert.equal(userExport.value.password,undefined);assert.equal(userExport.value.loginSessions[0].token,undefined)
 const database=new DatabaseSync(resolve(dataDir,'riyad.sqlite'));const owner=database.prepare('SELECT id FROM user WHERE email=?').get('owner@example.test');database.prepare('UPDATE app_profiles SET is_owner=1 WHERE user_id=?').run(owner.id)
 const csv=await fetch(`${origin}/api/admin/export?format=csv`,{headers:{Cookie:ownerCookie}});assert.equal(csv.status,200);assert.match(await csv.text(),/"'=Owner test"/)
 assert.equal((await request('/admin/users',{cookie:otherCookie})).response.status,403)
 const metadata=await request('/quran');assert.equal(metadata.value.chapters.length,114);assert.equal(metadata.value.ayahCount,6236)
 const surah=await request('/quran/1');assert.equal(surah.value.result.length,7);assert.ok(surah.value.result[0].footnotes)
 const maliciousPush=await request('/account/push',{cookie:ownerCookie,method:'POST',body:{subscription:{endpoint:'http://127.0.0.1:22',keys:{}}}});assert.equal(maliciousPush.response.status,400)
 const deleted=await request('/auth/delete-user',{cookie:ownerCookie,method:'POST',body:{password}});assert.equal(deleted.response.status,200)
 assert.equal(database.prepare('SELECT count(*) AS n FROM app_locations WHERE user_id=?').get(owner.id).n,0)
 assert.equal(database.prepare('SELECT count(*) AS n FROM app_consents WHERE user_id=?').get(owner.id).n,0)
 assert.equal((await request('/account',{cookie:ownerCookie})).response.status,401)
 database.close()
})
