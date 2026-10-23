import {test} from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtempSync,rmSync,readdirSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve} from 'node:path'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'

test('reading APIs require an authenticated Google-linked account',{timeout:45000},async t=>{
 const dir=mkdtempSync(resolve(tmpdir(),'riyad-access-')),origin='http://127.0.0.1:8795'
 const child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,NODE_ENV:'test',RIYAD_SKIP_ENV_FILE:'1',RIYAD_REQUIRE_GOOGLE:'1',RIYAD_DATA_DIR:dir,APP_ORIGIN:origin,API_PORT:'8795'},stdio:['ignore','pipe','pipe']})
 let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x)
 t.after(()=>{child.kill();setTimeout(()=>rmSync(dir,{recursive:true,force:true}),500).unref()})
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(`${origin}/api/health`)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready,output)
 assert.equal((await fetch(`${origin}/api/quran`)).status,401)
 const password='Access-test-password-145!',email='access@example.test'
 async function post(path,body){return fetch(`${origin}/api/auth/${path}`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)})}
 assert.equal((await post('sign-up/email',{name:'Access fixture',email,password,privacyAccepted:true})).status,200)
 const message=readdirSync(resolve(dir,'mail')).map(file=>JSON.parse(readFileSync(resolve(dir,'mail',file),'utf8'))).find(x=>x.to===email);assert.ok(message)
 await fetch(message.url,{redirect:'manual'})
 const login=await post('sign-in/email',{email,password}),cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');assert.ok(cookie)
 assert.equal((await fetch(`${origin}/api/quran`,{headers:{Cookie:cookie}})).status,403)
 const db=new DatabaseSync(resolve(dir,'riyad.sqlite')),user=db.prepare('SELECT id FROM user WHERE email=?').get(email)
 // Only the isolated fixture is linked. No Google request, credential or production user is changed.
 db.prepare('INSERT INTO account(id,accountId,providerId,userId,createdAt,updatedAt) VALUES(?,?,?,?,?,?)').run(randomUUID(),'fixture-google-id','google',user.id,Date.now(),Date.now())
 const response=await fetch(`${origin}/api/quran/1`,{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal((await response.json()).result.length,7)
 assert.equal((await(await fetch(`${origin}/api/account`,{headers:{Cookie:cookie}})).json()).googleConnected,true)
 db.close()
})
