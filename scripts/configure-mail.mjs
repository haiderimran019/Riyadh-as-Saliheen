import {readFileSync,writeFileSync,chmodSync} from 'node:fs'
import nodemailer from 'nodemailer'

if(!process.stdin.isTTY)throw new Error('Run this command yourself in an interactive Terminal. Never enter an app password in chat.')
const path='server/.env.local',source=readFileSync(path,'utf8')
const email=source.match(/^RIYAD_OWNER_EMAIL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'')
if(!email?.endsWith('@gmail.com'))throw new Error('Set the Gmail owner address in server/.env.local first.')
console.log(`Configure Gmail delivery for ${email}. Create a Google app password at https://myaccount.google.com/apppasswords, then paste it below. Input is hidden.`)
process.stdout.write('Gmail app password: ')
const password=await new Promise((resolve,reject)=>{
 let value='';process.stdin.setRawMode(true);process.stdin.resume()
 function finish(error){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');error?reject(error):resolve(value.replace(/\s/g,''))}
 function onData(chunk){for(const character of chunk.toString()){if(character==='\u0003')return finish(new Error('Cancelled.'));if(character==='\r'||character==='\n')return finish();if(character==='\u007f'||character==='\b')value=value.slice(0,-1);else if(/[a-zA-Z ]/.test(character))value+=character}}
 process.stdin.on('data',onData)
})
if(!/^[A-Za-z]{16}$/.test(password))throw new Error('A Google app password has 16 letters. Your normal Google password is not accepted.')
const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:email,pass:password}})
try{await transport.verify()}catch{throw new Error('Gmail did not accept the app password. Check it and run this command again.')}
const updates={SMTP_HOST:'smtp.gmail.com',SMTP_PORT:'465',SMTP_SECURE:'true',SMTP_USER:email,SMTP_PASSWORD:password,SMTP_FROM:`Riyad as-Salihin <${email}>`}
let next=source
for(const [key,value]of Object.entries(updates)){next=next.replace(new RegExp(`^${key}=.*\\r?\\n?`,'gm'),'');next=next.trimEnd()+`\n${key}=${value}\n`}
writeFileSync(path,next,{mode:0o600});chmodSync(path,0o600)
console.log('Gmail verified. Configuration saved privately; no password was printed. Tell Codex that Gmail is configured so the private Vercel environment can be updated.')
