import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
process.umask(0o077)
if (process.env.RIYAD_SKIP_ENV_FILE!=='1' && existsSync('server/.env.local')) process.loadEnvFile('server/.env.local')
export const config = {
  production: process.env.NODE_ENV === 'production',
  origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
  port: Number(process.env.API_PORT || 8787),
  host: process.env.API_HOST || '127.0.0.1',
  dataDir: resolve(process.env.RIYAD_DATA_DIR || '.data'),
  contentDir: resolve(process.env.RIYAD_CONTENT_DIR || 'data-local/generated'),
  ownerEmail: (process.env.RIYAD_OWNER_EMAIL || '').toLowerCase().trim(),
  googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  smtpEnabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
  privacyVersion: '2026-10-22-accounts-1',
}
const originUrl=new URL(config.origin)
if(originUrl.origin!==config.origin||originUrl.username||originUrl.password||!['http:','https:'].includes(originUrl.protocol))throw new Error('APP_ORIGIN must be a single origin without a path or credentials.')
if (config.production && !config.origin.startsWith('https://')) throw new Error('Production requires an HTTPS APP_ORIGIN.')
if (config.production && !process.env.VAPID_SUBJECT) throw new Error('Production requires a VAPID_SUBJECT contact URI.')
if (config.production && !config.smtpEnabled) throw new Error('Production requires SMTP for email verification and password recovery.')
mkdirSync(config.dataDir, { recursive:true, mode:0o700 })
export function privateFile(name, create) {
  const path = resolve(config.dataDir, name)
  if (!existsSync(path)) writeFileSync(path, JSON.stringify(create()), { mode:0o600 })
  chmodSync(path, 0o600)
  return JSON.parse(readFileSync(path, 'utf8'))
}
export const authSecret = process.env.BETTER_AUTH_SECRET || privateFile('auth-secret.json', () => ({ secret:randomBytes(48).toString('base64url') })).secret
