import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
process.umask(0o077)
if (process.env.RIYAD_SKIP_ENV_FILE!=='1' && existsSync('server/.env.local')) process.loadEnvFile('server/.env.local')
const cloud=process.env.VERCEL==='1'||process.env.RIYAD_SERVERLESS==='1'
export const config = {
  cloud,
  production: process.env.NODE_ENV === 'production',
  origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
  port: Number(process.env.API_PORT || 8787),
  host: process.env.API_HOST || '127.0.0.1',
  dataDir: resolve(process.env.RIYAD_DATA_DIR || (cloud?'/tmp/riyad':'.data')),
  contentDir: resolve(process.env.RIYAD_CONTENT_DIR || (cloud?'riyad-runtime/content':'data-local/generated')),
  ownerEmail: (process.env.RIYAD_OWNER_EMAIL || '').toLowerCase().trim(),
  googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  smtpEnabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
  privacyVersion: '2026-10-23-choice-3',
  requireGoogleSignIn: process.env.RIYAD_REQUIRE_GOOGLE !== '0',
}
const originUrl=new URL(config.origin)
if(originUrl.origin!==config.origin||originUrl.username||originUrl.password||!['http:','https:'].includes(originUrl.protocol))throw new Error('APP_ORIGIN must be a single origin without a path or credentials.')
if (config.production && !config.origin.startsWith('https://')) throw new Error('Production requires an HTTPS APP_ORIGIN.')
if (config.production && !process.env.VAPID_SUBJECT) throw new Error('Production requires a VAPID_SUBJECT contact URI.')
if(config.cloud&&(!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET||!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY))throw new Error('Cloud deployment requires persistent database and private authentication/push keys.')
config.emailPasswordEnabled=!config.production||config.smtpEnabled
if(!config.cloud)mkdirSync(config.dataDir, { recursive:true, mode:0o700 })
export function privateFile(name, create) {
  if(config.cloud)throw new Error('Cloud secrets must be set in private environment variables.')
  const path = resolve(config.dataDir, name)
  if (!existsSync(path)) writeFileSync(path, JSON.stringify(create()), { mode:0o600 })
  chmodSync(path, 0o600)
  return JSON.parse(readFileSync(path, 'utf8'))
}
export const authSecret = process.env.BETTER_AUTH_SECRET || privateFile('auth-secret.json', () => ({ secret:randomBytes(48).toString('base64url') })).secret
