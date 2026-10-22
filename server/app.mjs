import express from 'express';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { z } from 'zod';
import { randomUUID, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from './config.mjs';
import { limitRequest } from './rate-limit.mjs';
import {timingSafeEqual} from 'node:crypto';
import { attachProductionWeb } from './web.mjs';
import { purgeLocalMail } from './mail.mjs';
import { auth } from './auth.mjs';
import { all, get, run, transaction, preferences, locationFor, recordConsent } from './database.mjs';
import { calculatePrayerTimes, validZone, methods, dailySchedule } from './prayer.mjs';
import { pushPublicKey, validateSubscription, resetSchedule, processJobs, sendToSubscription } from './push.mjs';

export function createApplication({renderer}={}) {
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => { res.locals.nonce = randomBytes(18).toString('base64'); if (config.production)
    res.set({ 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', 'Content-Security-Policy': `default-src 'self'; script-src 'self' 'nonce-${res.locals.nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`, 'X-Frame-Options': 'DENY' }); res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()' }); if (req.path.startsWith('/api/'))
    res.set('Cache-Control', 'no-store'); next(); });
app.get('/api/internal/reconcile',async(req,res)=>{
 const expected=Buffer.from(`Bearer ${process.env.CRON_SECRET||''}`),actual=Buffer.from(req.headers.authorization||'')
 if(!process.env.CRON_SECRET||expected.length!==actual.length||!timingSafeEqual(expected,actual))return res.status(401).json({error:'Not authorized.'})
 const {reconcileSchedules}=await import('./workflow-runtime.mjs');await reconcileSchedules();res.json({ok:true})
})
app.use('/api',async(req,res,next)=>{
 if(Number(req.headers['content-length']||0)>32768)return res.status(413).json({error:'This request is too large.'})
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==config.origin)return res.status(403).json({error:'This request did not come from this reading app.'})
 if(!await limitRequest(req,config.production?200:1200))return res.status(429).json({error:'Please wait a minute before trying again.'})
 next()
})
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json({ limit: '24kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, googleEnabled: config.googleEnabled, emailPasswordEnabled: config.emailPasswordEnabled, emailDelivery: config.smtpEnabled ? 'smtp' : config.production?'unavailable':'local-outbox', pushPublicKey, privacyVersion: config.privacyVersion }));
async function user(req, res, next) {
    try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (!session?.user)
            return res.status(401).json({ error: 'Sign in to use your account.', code: 'SIGN_IN_REQUIRED' });
        req.account = session.user;
        req.profile = await get('SELECT * FROM app_profiles WHERE user_id=?', session.user.id);
        next();
    }
    catch (error) {
        next(error);
    }
}
function verified(req, res, next) { if (!req.account.emailVerified)
    return res.status(403).json({ error: 'Verify your email before saving account data.', code: 'VERIFY_EMAIL' }); next(); }
function consented(req, res, next) { if (req.profile?.privacy_version !== config.privacyVersion)
    return res.status(403).json({ error: 'Review and accept the current privacy notice in your account.', code: 'CONSENT_REQUIRED' }); next(); }
function owner(req, res, next) { if (!req.profile?.is_owner)
    return res.status(403).json({ error: 'This page is available only to the owner.' }); next(); }
const zone = z.string().refine(validZone, 'Choose a valid timezone.');
const locationSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), timezone: zone, label: z.string().trim().max(80), source: z.enum(['gps', 'manual']), consent: z.literal(true) }).strict();
const preferenceSchema = z.object({ hadith: z.boolean(), ayah: z.boolean(), prayers: z.boolean(), vibration: z.boolean(), hadithTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), timezone: zone, method: z.enum(methods), school: z.enum(['standard', 'hanafi']) }).strict();
app.post('/api/prayers', (req, res) => { const parsed = z.object({ latitude: z.number(), longitude: z.number(), timezone: zone, method: z.enum(methods), school: z.enum(['standard', 'hanafi']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).strict().parse(req.body); res.json(calculatePrayerTimes(parsed)); });
const quranDir = resolve(config.contentDir, 'quran');
app.get('/api/quran', (_req, res) => { const path = resolve(quranDir, 'index.json'); if (!existsSync(path))
    return res.status(503).json({ error: 'The Quran dataset is not imported. Run npm run data:import:quran.' }); res.set('Cache-Control', 'public,max-age=3600').type('json').send(readFileSync(path, 'utf8')); });
app.get('/api/quran/:surah', (req, res) => { const id = Number(req.params.surah); if (!Number.isInteger(id) || id < 1 || id > 114)
    return res.status(400).json({ error: 'Choose a surah from 1 to 114.' }); const path = resolve(quranDir, `${id}.json`); if (!existsSync(path))
    return res.status(503).json({ error: 'This surah has not been imported yet.' }); res.set('Cache-Control', 'public,max-age=3600').type('json').send(readFileSync(path, 'utf8')); });
app.get('/api/account', user, async (req, res) => res.json({ user: { id: req.account.id, name: req.account.name, email: req.account.email, emailVerified: req.account.emailVerified }, owner: !!req.profile?.is_owner, privacyVersion: req.profile?.privacy_version, location: await locationFor(req.account.id), preferences: await preferences(req.account.id), preferencesSaved: !!await get('SELECT user_id FROM app_reminders WHERE user_id=?', req.account.id), devices: await all('SELECT id,created_at FROM app_push WHERE user_id=?', req.account.id), consents: await all('SELECT purpose,granted,version,recorded_at FROM app_consents WHERE user_id=? ORDER BY recorded_at DESC', req.account.id) }));
app.post('/api/account/consent', user, verified, async (req, res) => { if (req.body.accepted !== true)
    return res.status(400).json({ error: 'Please accept the account privacy notice.' }); await transaction(async () => { await run('UPDATE app_profiles SET privacy_version=?,accepted_at=? WHERE user_id=?', config.privacyVersion, Date.now(), req.account.id); await recordConsent(req.account.id, 'account', true); }); res.json({ ok: true }); });
app.put('/api/account/location', user, verified, consented, async (req, res) => { const v = locationSchema.parse(req.body); await transaction(async () => { await run('INSERT INTO app_locations(user_id,latitude,longitude,label,timezone,source,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,label=excluded.label,timezone=excluded.timezone,source=excluded.source,updated_at=excluded.updated_at', req.account.id, Math.round(v.latitude * 1000) / 1000, Math.round(v.longitude * 1000) / 1000, v.label, v.timezone, v.source, Date.now()); await recordConsent(req.account.id, 'location', true); }); await resetSchedule(req.account.id); res.json({ location: await locationFor(req.account.id) }); });
app.delete('/api/account/location', user, verified, consented, async (req, res) => { await transaction(async () => { await run('DELETE FROM app_locations WHERE user_id=?', req.account.id); await run('UPDATE app_reminders SET prayers=0 WHERE user_id=?', req.account.id); await recordConsent(req.account.id, 'location', false); }); await resetSchedule(req.account.id); res.json({ ok: true }); });
app.put('/api/account/reminders', user, verified, consented, async (req, res) => { const p = preferenceSchema.parse(req.body); if (p.prayers && !await locationFor(req.account.id))
    return res.status(400).json({ error: 'Save a location in Prayer times before enabling prayer reminders.' }); await transaction(async () => { await run('INSERT INTO app_reminders(user_id,hadith,ayah,prayers,vibration,hadith_time,timezone,method,school,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET hadith=excluded.hadith,ayah=excluded.ayah,prayers=excluded.prayers,vibration=excluded.vibration,hadith_time=excluded.hadith_time,timezone=excluded.timezone,method=excluded.method,school=excluded.school,updated_at=excluded.updated_at', req.account.id, +p.hadith, +p.ayah, +p.prayers, +p.vibration, p.hadithTime, p.timezone, p.method, p.school, Date.now()); await recordConsent(req.account.id, 'reminders', p.hadith || p.ayah || p.prayers); }); await resetSchedule(req.account.id); res.json({ preferences: p }); });
app.post('/api/account/push', user, verified, consented, async (req, res) => { const value = validateSubscription(req.body.subscription); const existing = await get('SELECT user_id FROM app_push WHERE endpoint=?', value.endpoint); if (existing && existing.user_id !== req.account.id)
    await run('DELETE FROM app_push WHERE endpoint=?', value.endpoint); await run('INSERT INTO app_push(id,user_id,endpoint,subscription,created_at) VALUES(?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET subscription=excluded.subscription', randomUUID(), req.account.id, value.endpoint, JSON.stringify(value), Date.now()); await recordConsent(req.account.id, 'push', true); await resetSchedule(req.account.id); res.json({ ok: true }); });
app.post('/api/account/push/disconnect', user, verified, async (req, res) => { if (typeof req.body.endpoint !== 'string')
    return res.status(400).json({ error: 'Invalid subscription.' }); await run('DELETE FROM app_push WHERE endpoint=? AND user_id=?', req.body.endpoint, req.account.id); res.json({ ok: true }); });
app.delete('/api/account/push/:id', user, verified, consented, async (req, res) => { await run('DELETE FROM app_push WHERE id=? AND user_id=?', req.params.id, req.account.id); res.json({ ok: true }); });
app.post('/api/account/push/test', user, verified, consented, async (req, res) => { const devices = await all('SELECT * FROM app_push WHERE user_id=?', req.account.id); if (!devices.length)
    return res.status(400).json({ error: 'Enable notifications on this device first.' }); let delivered = 0; for (const x of devices) {
    try {
        await sendToSubscription(x, { title: 'Riyad reminders are ready', body: 'Your notification connection is working.', url: '/reminders', tag: `test-${Date.now()}`, vibration: (await preferences(req.account.id)).vibration });
        delivered++;
    }
    catch (error) {
        if ([404, 410].includes(error.statusCode))
            await run('DELETE FROM app_push WHERE id=?', x.id);
    }
} if (!delivered)
    return res.status(502).json({ error: 'The push service could not accept this test. Reconnect notifications and try again.' }); res.json({ accepted: delivered }); });
app.get('/api/account/schedule', user, async (req, res) => res.json({ jobs: await all("SELECT kind,due_at,status FROM app_jobs WHERE user_id=? AND due_at>? ORDER BY due_at LIMIT 20", req.account.id, Date.now()) }));
async function inventory(id) { const u = await get('SELECT id,name,email,emailVerified,createdAt,updatedAt FROM user WHERE id=?', id); return { profile: u, location: await locationFor(id), preferences: await preferences(id), consents: await all('SELECT purpose,granted,version,recorded_at FROM app_consents WHERE user_id=?', id), devices: await all('SELECT id,created_at FROM app_push WHERE user_id=?', id), loginSessions: await all('SELECT createdAt,expiresAt,userAgent FROM session WHERE userId=?', id), reminderHistory: await all('SELECT kind,due_at,status FROM app_jobs WHERE user_id=? ORDER BY due_at DESC', id), exportedAt: new Date().toISOString(), excluded: 'Passwords, session credentials and push encryption keys are excluded.' }; }
app.get('/api/account/export', user, async (req, res) => { res.set('Content-Disposition', 'attachment; filename="riyad-my-data.json"').json(await inventory(req.account.id)); });
async function ownerRows() { return await Promise.all((await all('SELECT u.id,u.name,u.email,u.emailVerified,u.createdAt,p.accepted_at FROM user u LEFT JOIN app_profiles p ON p.user_id=u.id ORDER BY u.createdAt DESC')).map(async (x) => ({ ...x, location: await locationFor(x.id), preferences: await preferences(x.id), notificationDevices: (await get('SELECT count(*) AS count FROM app_push WHERE user_id=?', x.id)).count }))); }
app.get('/api/admin/users', user, verified, consented, owner, async (req, res) => { await run('INSERT INTO app_audit(owner_id,action,created_at) VALUES(?,?,?)', req.account.id, 'users.viewed', Date.now()); res.json({ users: await ownerRows() }); });
app.get('/api/admin/export', user, verified, consented, owner, async (req, res) => { await run('INSERT INTO app_audit(owner_id,action,created_at) VALUES(?,?,?)', req.account.id, 'users.exported', Date.now()); const rows = await ownerRows(); if (req.query.format === 'csv') {
    const cell = v => { let text = String(v ?? ''); if (typeof v === 'string' && /^[=+\-@\t\r]/.test(text))
        text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
    const headers = ['name', 'email', 'emailVerified', 'createdAt', 'locationLabel', 'latitude', 'longitude', 'timezone', 'locationSharedAt', 'hadithReminder', 'ayahReminder', 'prayerReminder'];
    const lines = rows.map(x => [x.name, x.email, x.emailVerified, x.createdAt, x.location?.label, x.location?.latitude, x.location?.longitude, x.location?.timezone, x.location?.updatedAt, x.preferences.hadith, x.preferences.ayah, x.preferences.prayers].map(cell).join(','));
    res.set('Content-Disposition', 'attachment; filename="riyad-users.csv"').type('text/csv').send([headers.join(','), ...lines].join('\r\n'));
}
else
    res.set('Content-Disposition', 'attachment; filename="riyad-users.json"').json({ users: rows, exportedAt: new Date().toISOString() }); });
app.use('/api', (_req, res) => res.status(404).json({ error: 'This endpoint was not found.' }));
if (config.production)
    attachProductionWeb(app, { origin: config.origin, contentDir: config.contentDir, indexable: !['localhost', '127.0.0.1'].includes(new URL(config.origin).hostname), renderer, capabilities: { ok: true, googleEnabled: config.googleEnabled, emailPasswordEnabled: config.emailPasswordEnabled, emailDelivery: config.smtpEnabled ? 'smtp' : config.production?'unavailable':'local-outbox', pushPublicKey, privacyVersion: config.privacyVersion } });
app.use((error, _req, res, _next) => { const message = error instanceof z.ZodError ? 'Check the form values and try again.' : error.message; const safe = /^(Choose |Invalid |This push |Please |Enter )/.test(message); res.status(error instanceof z.ZodError || safe ? 400 : 500).json({ error: safe ? message : 'The request could not be completed. Please try again.' }); });

return app;
}
