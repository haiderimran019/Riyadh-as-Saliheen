import { config } from '../server/config.mjs'
import { readdirSync,readFileSync,existsSync } from 'node:fs'
import { resolve } from 'node:path'
const action=process.argv[2]
if(action==='mail'){
 const folder=resolve(config.dataDir,'mail');const files=existsSync(folder)?readdirSync(folder).filter(x=>x.endsWith('.json')).sort():[]
 const requested=process.argv[3]
 const mails=files.map(x=>JSON.parse(readFileSync(resolve(folder,x),'utf8'))).filter(x=>!requested||x.to.toLowerCase()===requested.toLowerCase())
 const latest=mails.at(-1);if(!latest){console.log('No local account mail found.');process.exit(1)}
 console.log(`To: ${latest.to}\n${latest.subject}\n\n${latest.url}\n\nThis link is private. Open it only for your own account; do not share it.`)
}else if(action==='grant'){
 if(!config.ownerEmail)throw new Error('Set RIYAD_OWNER_EMAIL in server/.env.local first.')
 const {get,run}=await import('../server/database.mjs')
 const user=get('SELECT id,email,emailVerified FROM user WHERE lower(email)=?',config.ownerEmail)
 if(!user)throw new Error('Create the owner account in the app first.')
 if(!user.emailVerified)throw new Error('Verify the owner email before granting access.')
 const profile=get('SELECT privacy_version FROM app_profiles WHERE user_id=?',user.id)
 if(profile?.privacy_version!==config.privacyVersion)throw new Error('Accept the current privacy notice in the app first.')
 run('UPDATE app_profiles SET is_owner=1 WHERE user_id=?',user.id)
 console.log(`Owner access granted to verified account ${user.email}. Refresh the Account page to open the owner dashboard.`)
}else{console.error('Use npm run mail:latest [-- email] or npm run owner:grant.');process.exit(1)}
