import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import nodemailer from 'nodemailer'
import { config } from './config.mjs'
export async function sendAccountMail(to, subject, url) {
  const parsed=new URL(url)
  if (parsed.origin !== config.origin) throw new Error('Account links must use the configured origin.')
  const text=`${subject}\n\nOpen this link to continue with Riyad as-Salihin:\n${url}\n\nIf you did not request this, ignore this message.`
  if (config.smtpEnabled) {
    const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT || 587),secure:process.env.SMTP_SECURE==='true',auth:process.env.SMTP_USER ? {user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD} : undefined})
    await transport.sendMail({from:process.env.SMTP_FROM,to,subject,text})
  } else {
    if(config.production)throw new Error('Email delivery is not configured. Continue with Google instead.')
    const folder=resolve(config.dataDir,'mail');mkdirSync(folder,{recursive:true,mode:0o700})
    writeFileSync(resolve(folder,`${Date.now()}-${randomUUID()}.json`),JSON.stringify({to,subject,url,createdAt:Date.now()},null,2),{mode:0o600})
  }
}
export async function purgeLocalMail(email) {
  if(config.smtpEnabled)return
  const {readdirSync,unlinkSync}=await import('node:fs')
  const folder=resolve(config.dataDir,'mail');if(!existsSync(folder))return
  for(const file of readdirSync(folder).filter(x=>x.endsWith('.json'))){try{const path=resolve(folder,file),value=JSON.parse(readFileSync(path,'utf8'));if(value.to.toLowerCase()===email.toLowerCase()||value.createdAt<Date.now()-86400000)unlinkSync(path)}catch{/* Ignore expired or malformed local messages. */}}
}
