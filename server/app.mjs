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
import { analyticsEnabled, setAnalytics, receiveUsage, usageSummary, usageInventory, cleanupUsage } from './analytics.mjs';
import { indopakSurah, indopakFont } from './quran-scripts.mjs';
import { quranEditions } from '../shared/quran-editions.mjs';
import { auth } from './auth.mjs';
import { all, get, run, transaction, preferences, locationFor, recordConsent,postgres } from './database.mjs';
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
 const {reconcileSchedules}=await import('./workflow-runtime.mjs');await reconcileSchedules();await cleanupUsage();res.json({ok:true})
})
app.use('/api',async(req,res,next)=>{
 if(Number(req.headers['content-length']||0)>32768)return res.status(413).json({error:'This request is too large.'})
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin!==config.origin)return res.status(403).json({error:'This request did not come from this reading app.'})
 if(!await limitRequest(req,config.production?200:1200))return res.status(429).json({error:'Please wait a minute before trying again.'})
 next()
})
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json({ limit: '24kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, googleEnabled: config.googleEnabled, emailPasswordEnabled: config.emailPasswordEnabled, emailDelivery: config.smtpEnabled ? 'smtp' : config.production?'unavailable':'local-outbox', pushPublicKey, privacyVersion: config.privacyVersion, requireGoogleSignIn: config.requireGoogleSignIn }));
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
async function googleOnly(req,res,next) { if(config.requireGoogleSignIn && !await get("SELECT id FROM account WHERE userId=? AND providerId='google'",req.account.id))return res.status(403).json({error:'Connect Google to continue to the reading app.',code:'GOOGLE_REQUIRED'});next() }
const readingAccess=config.requireGoogleSignIn?[user,googleOnly]:[];
function verified(req, res, next) { if (!req.account.emailVerified)
    return res.status(403).json({ error: 'Verify your email before saving account data.', code: 'VERIFY_EMAIL' }); next(); }
function consented(req, res, next) { if (req.profile?.privacy_version !== config.privacyVersion)
    return res.status(403).json({ error: 'Review and accept the current privacy notice in your account.', code: 'CONSENT_REQUIRED' }); next(); }
function owner(req, res, next) { if (!req.profile?.is_owner)
    return res.status(403).json({ error: 'This page is available only to the owner.' }); next(); }
const zone = z.string().refine(validZone, 'Choose a valid timezone.');
const locationSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), timezone: zone, label: z.string().trim().max(80), source: z.enum(['gps', 'manual']), consent: z.literal(true), precision: z.enum(['approximate','precise']).default('approximate'), accuracy: z.number().min(0).max(100000).optional(), live: z.boolean().default(false), preciseConsent: z.boolean().optional(),liveUpdate:z.boolean().default(false) }).strict();
const preferenceSchema = z.object({ hadith: z.boolean(), ayah: z.boolean(), prayers: z.boolean(), vibration: z.boolean(), hadithTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), timezone: zone, method: z.enum(methods), school: z.enum(['standard', 'hanafi']) }).strict();
app.post('/api/prayers', ...readingAccess, (req, res) => { const parsed = z.object({ latitude: z.number(), longitude: z.number(), timezone: zone, method: z.enum(methods), school: z.enum(['standard', 'hanafi']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).strict().parse(req.body); res.json(calculatePrayerTimes(parsed)); });
const quranDir = resolve(config.contentDir, 'quran');
app.get('/api/quran', ...readingAccess, (_req, res) => { const path = resolve(quranDir, 'index.json'); if (!existsSync(path))
    return res.status(503).json({ error: 'The Quran dataset is not imported. Run npm run data:import:quran.' }); const value=JSON.parse(readFileSync(path,'utf8'));value.editions=quranEditions;res.set('Cache-Control','no-store').json(value); });
app.get('/api/quran/font/indopak.woff2', ...readingAccess, async(_req,res)=>res.type('font/woff2').send(await indopakFont()));
app.get('/api/quran/:surah', ...readingAccess, async(req, res) => { const id = Number(req.params.surah); if (!Number.isInteger(id) || id < 1 || id > 114)
    return res.status(400).json({ error: 'Choose a surah from 1 to 114.' }); const edition=typeof req.query.edition==='string'?req.query.edition:'english_saheeh';if(!quranEditions.some(x=>x.key===edition))return res.status(400).json({error:'Choose a published Quran translation.'});const path = resolve(quranDir, edition==='english_saheeh'?`${id}.json`:`editions/${edition}/${id}.json`); if (!existsSync(path))
    return res.status(503).json({ error: 'This surah has not been imported yet.' }); const value=JSON.parse(readFileSync(path,'utf8'));if(req.query.script==='indopak'){const script=await indopakSurah(id,value.result.length);value.script=script;value.result=value.result.map((x,i)=>({...x,arabic_text:script.result[i].text}));}else if(req.query.script&&req.query.script!=='uthmani')return res.status(400).json({error:'Choose Uthmani or IndoPak.'});res.set('Cache-Control','no-store').json(value); });
app.get('/api/account', user, async (req, res) => res.json({ user: { id: req.account.id, name: req.account.name, email: req.account.email, emailVerified: req.account.emailVerified }, owner: !!req.profile?.is_owner, googleConnected: !!await get("SELECT id FROM account WHERE userId=? AND providerId='google'",req.account.id), analyticsEnabled: await analyticsEnabled(req.account.id), analyticsHasHistory: !!await get('SELECT id FROM app_usage_sessions WHERE user_id=? LIMIT 1',req.account.id), analyticsChoiceMade: !!await get('SELECT user_id FROM app_analytics_consent WHERE user_id=? AND version=?',req.account.id,config.privacyVersion), privacyVersion: req.profile?.privacy_version, location: await locationFor(req.account.id), preferences: await preferences(req.account.id), preferencesSaved: !!await get('SELECT user_id FROM app_reminders WHERE user_id=?', req.account.id), devices: await all('SELECT id,created_at FROM app_push WHERE user_id=?', req.account.id), consents: await all('SELECT purpose,granted,version,recorded_at FROM app_consents WHERE user_id=? ORDER BY recorded_at DESC', req.account.id) }));
app.post('/api/account/consent', user, verified, async (req, res) => { if (req.body.accepted !== true)
    return res.status(400).json({ error: 'Please accept the account privacy notice.' }); await transaction(async () => { await run('UPDATE app_profiles SET privacy_version=?,accepted_at=? WHERE user_id=?', config.privacyVersion, Date.now(), req.account.id); await recordConsent(req.account.id, 'account', true); }); res.json({ ok: true }); });
app.put('/api/account/location', user, verified, consented, async (req, res) => { const v = locationSchema.parse(req.body); if(v.precision==='precise'&&(v.source!=='gps'||v.preciseConsent!==true))return res.status(400).json({error:'Allow precise GPS sharing separately before saving it.'});await transaction(async () => { if(postgres)await get('SELECT user_id FROM app_profiles WHERE user_id=? FOR UPDATE',req.account.id);if(v.liveUpdate){const saved=await locationFor(req.account.id);if(!saved||saved.precision!=='precise'||!saved.live)throw new Error('Please save your precise location again before live sharing.')}await run('INSERT INTO app_locations(user_id,latitude,longitude,label,timezone,source,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,label=excluded.label,timezone=excluded.timezone,source=excluded.source,updated_at=excluded.updated_at', req.account.id, Math.round(v.latitude * (v.precision==='precise'?1e6:1e3)) / (v.precision==='precise'?1e6:1e3), Math.round(v.longitude * (v.precision==='precise'?1e6:1e3)) / (v.precision==='precise'?1e6:1e3), v.label, v.timezone, v.source, Date.now()); await run('INSERT INTO app_location_details(user_id,precision,accuracy,live) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET precision=excluded.precision,accuracy=excluded.accuracy,live=excluded.live',req.account.id,v.precision,v.accuracy??null,+v.live);const prior=await get("SELECT granted FROM app_consents WHERE user_id=? AND purpose='precise_location' ORDER BY recorded_at DESC LIMIT 1",req.account.id);if((prior?.granted||0)!==+(v.precision==='precise'))await recordConsent(req.account.id,'precise_location',v.precision==='precise');const priorLocation=await get("SELECT granted FROM app_consents WHERE user_id=? AND purpose='location' ORDER BY recorded_at DESC LIMIT 1",req.account.id);if(!priorLocation?.granted)await recordConsent(req.account.id, 'location', true); }); await resetSchedule(req.account.id); res.json({ location: await locationFor(req.account.id) }); });
app.delete('/api/account/location', user, verified, async (req, res) => { await transaction(async () => { if(postgres)await get('SELECT user_id FROM app_profiles WHERE user_id=? FOR UPDATE',req.account.id);await run('DELETE FROM app_locations WHERE user_id=?', req.account.id);await run('DELETE FROM app_location_details WHERE user_id=?',req.account.id);await recordConsent(req.account.id,'precise_location',false); await run('UPDATE app_reminders SET prayers=0 WHERE user_id=?', req.account.id); await recordConsent(req.account.id, 'location', false); }); await resetSchedule(req.account.id); res.json({ ok: true }); });
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
app.put('/api/account/analytics',user,verified,(req,res,next)=>req.body.enabled===false?next():consented(req,res,next),async(req,res)=>{const {enabled}=z.object({enabled:z.boolean()}).strict().parse(req.body);await setAnalytics(req.account.id,enabled);res.json({enabled});});
app.post('/api/usage',user,verified,consented,async(req,res)=>{const accepted=await receiveUsage(req.account.id,req.body);res.status(accepted?202:403).json({accepted});});
app.get('/api/admin/analytics',user,verified,consented,owner,async(req,res)=>{await run('INSERT INTO app_audit(owner_id,action,created_at) VALUES(?,?,?)',req.account.id,'usage.viewed',Date.now());const days=z.coerce.number().int().min(1).max(30).parse(req.query.days||7),timezone=zone.parse(req.query.timezone||'UTC');res.json(await usageSummary(days,timezone));});
app.get('/api/admin/analytics/export',user,verified,consented,owner,async(req,res)=>{await run('INSERT INTO app_audit(owner_id,action,created_at) VALUES(?,?,?)',req.account.id,'usage.exported',Date.now());const since=Date.now()-30*86400000;res.set('Content-Disposition','attachment; filename=riyad-usage.json').json({summary:await usageSummary(30,zone.parse(req.query.timezone||'UTC')),sessions:await all('SELECT id,user_id,started_at,last_seen,active_ms,ended_at,timezone,language FROM app_usage_sessions WHERE started_at>=? ORDER BY started_at LIMIT 50000',since),events:await all('SELECT user_id,session_id,event_type,page,control,flow,occurred_at FROM app_usage_events WHERE occurred_at>=? ORDER BY occurred_at LIMIT 100000',since),note:'Only consented activity; bounded to 50000 sessions and 100000 events over 30 days.'});});
async function inventory(id) { const u = await get('SELECT id,name,email,emailVerified,createdAt,updatedAt FROM user WHERE id=?', id); return { usage: await usageInventory(id), analyticsEnabled: await analyticsEnabled(id), profile: u, location: await locationFor(id), preferences: await preferences(id), consents: await all('SELECT purpose,granted,version,recorded_at FROM app_consents WHERE user_id=?', id), devices: await all('SELECT id,created_at FROM app_push WHERE user_id=?', id), loginSessions: await all('SELECT createdAt,expiresAt,userAgent FROM session WHERE userId=?', id), reminderHistory: await all('SELECT kind,due_at,status FROM app_jobs WHERE user_id=? ORDER BY due_at DESC', id), exportedAt: new Date().toISOString(), excluded: 'Passwords, session credentials and push encryption keys are excluded.' }; }
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
    attachProductionWeb(app, { origin: config.origin, contentDir: config.contentDir, indexable: !['localhost', '127.0.0.1'].includes(new URL(config.origin).hostname), renderer, capabilities: { ok: true, googleEnabled: config.googleEnabled, emailPasswordEnabled: config.emailPasswordEnabled, emailDelivery: config.smtpEnabled ? 'smtp' : config.production?'unavailable':'local-outbox', pushPublicKey, privacyVersion: config.privacyVersion, requireGoogleSignIn: config.requireGoogleSignIn } });
app.use((error, _req, res, _next) => { const message = error instanceof z.ZodError ? 'Check the form values and try again.' : error.message; const safe = /^(Choose |Invalid |This push |Please |Enter )/.test(message); res.status(error instanceof z.ZodError || safe ? 400 : 500).json({ error: safe ? message : 'The request could not be completed. Please try again.' }); });

return app;
}
