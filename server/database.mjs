import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'
import { chmodSync } from 'node:fs'
import { config } from './config.mjs'
export const db = new DatabaseSync(resolve(config.dataDir, 'riyad.sqlite'))
chmodSync(resolve(config.dataDir, 'riyad.sqlite'), 0o600)
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;')
export const get = (sql, ...args) => db.prepare(sql).get(...args)
export const all = (sql, ...args) => db.prepare(sql).all(...args)
export const run = (sql, ...args) => db.prepare(sql).run(...args)
export function transaction(fn) { db.exec('BEGIN IMMEDIATE'); try { const result=fn(); db.exec('COMMIT'); return result } catch(error) { db.exec('ROLLBACK'); throw error } }
export function migrateApplication() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_profiles (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, is_owner INTEGER NOT NULL DEFAULT 0, privacy_version TEXT NOT NULL DEFAULT '', accepted_at INTEGER, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_consents (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, purpose TEXT NOT NULL, granted INTEGER NOT NULL, version TEXT NOT NULL, recorded_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_locations (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, latitude REAL NOT NULL, longitude REAL NOT NULL, label TEXT NOT NULL, timezone TEXT NOT NULL, source TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_reminders (user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE, hadith INTEGER NOT NULL DEFAULT 0, ayah INTEGER NOT NULL DEFAULT 0, prayers INTEGER NOT NULL DEFAULT 0, vibration INTEGER NOT NULL DEFAULT 1, hadith_time TEXT NOT NULL DEFAULT '09:00', timezone TEXT NOT NULL DEFAULT 'UTC', method TEXT NOT NULL DEFAULT 'MuslimWorldLeague', school TEXT NOT NULL DEFAULT 'standard', updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_push (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, endpoint TEXT NOT NULL UNIQUE, subscription TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS app_jobs (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, kind TEXT NOT NULL, due_at INTEGER NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, UNIQUE(user_id,kind,due_at));
    CREATE INDEX IF NOT EXISTS app_jobs_due ON app_jobs(status,due_at);
    CREATE TABLE IF NOT EXISTS app_deliveries (job_id TEXT NOT NULL REFERENCES app_jobs(id) ON DELETE CASCADE, subscription_id TEXT NOT NULL REFERENCES app_push(id) ON DELETE CASCADE, delivered_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(job_id,subscription_id));
    CREATE TABLE IF NOT EXISTS app_audit (id INTEGER PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE, action TEXT NOT NULL, created_at INTEGER NOT NULL);
  `)
}
export const defaultPreferences = (timezone='UTC') => ({ hadith:false, ayah:false, prayers:false, vibration:true, hadithTime:'09:00', timezone, method:'MuslimWorldLeague', school:'standard' })
export function preferences(userId) {
  const row=get('SELECT * FROM app_reminders WHERE user_id=?',userId)
  return row ? { hadith:!!row.hadith, ayah:!!row.ayah, prayers:!!row.prayers, vibration:!!row.vibration, hadithTime:row.hadith_time, timezone:row.timezone, method:row.method, school:row.school } : defaultPreferences()
}
export const locationFor = (id) => { const x=get('SELECT * FROM app_locations WHERE user_id=?',id); return x ? { latitude:x.latitude, longitude:x.longitude,label:x.label,timezone:x.timezone,source:x.source,updatedAt:x.updated_at } : null }
export function recordConsent(userId,purpose,granted) { run('INSERT INTO app_consents(user_id,purpose,granted,version,recorded_at) VALUES(?,?,?,?,?)',userId,purpose,Number(granted),config.privacyVersion,Date.now()) }
