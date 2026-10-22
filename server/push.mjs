import webpush from 'web-push';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config, privateFile } from './config.mjs';
import { all, get, run, preferences, locationFor } from './database.mjs';
import {newScheduleGeneration,startSchedule} from './workflow-runtime.mjs';
import { dailySchedule, calculatePrayerTimes } from './prayer.mjs';
const keys = config.cloud?{publicKey:process.env.VAPID_PUBLIC_KEY,privateKey:process.env.VAPID_PRIVATE_KEY}:privateFile('vapid.json',()=>webpush.generateVAPIDKeys());
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://example.com/riyad/local-development', keys.publicKey, keys.privateKey);
export const pushPublicKey = keys.publicKey;
const hosts = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'web.push.apple.com', 'wns.windows.com', 'notify.windows.com'];
export function validateSubscription(value) {
    if (typeof value?.endpoint !== 'string')
        throw new Error('Invalid push subscription.');
    let endpoint;
    try {
        endpoint = new URL(value.endpoint);
    }
    catch {
        throw new Error('Invalid push subscription.');
    }
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.port || !hosts.some(x => endpoint.hostname === x || (['push.services.mozilla.com', 'web.push.apple.com', 'notify.windows.com', 'wns.windows.com'].includes(x) && endpoint.hostname.endsWith(`.${x}`))) || value.endpoint.length > 2048)
        throw new Error('This push service is not supported.');
    const { p256dh, auth } = value?.keys || {};
    if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[A-Za-z0-9_-]+={0,2}$/.test(p256dh) || !/^[A-Za-z0-9_-]+={0,2}$/.test(auth) || Buffer.from(p256dh, 'base64url').length !== 65 || Buffer.from(auth, 'base64url').length !== 16)
        throw new Error('Invalid device notification keys.');
    return { endpoint: endpoint.toString(), keys: { p256dh, auth }, expirationTime: null };
}
let readingReferences = null, quranChapters = null;
function content(kind, day) {
    const number = Math.abs(Math.floor(DateTime.fromISO(day, { zone: 'UTC' }).toMillis() / 86400000));
    if (kind === 'hadith') {
        const path = resolve(config.contentDir, 'riyad-as-salihin/all.json');
        if (existsSync(path)) {
            if (!readingReferences)
                readingReferences = JSON.parse(readFileSync(path, 'utf8')).records.map(x => ({ id: x.id, chapter: x.chapter }));
            const x = readingReferences[number % readingReferences.length];
            return { title: 'Your daily hadith', body: 'A moment with Riyad as-Salihin is ready. Open the full narration and its source.', url: `/collection/riyad-as-salihin/chapter/${x.chapter}?hadith=${encodeURIComponent(x.id)}#${x.id}` };
        }
        return { title: 'Your daily hadith', body: 'Make a little time for today’s reading.', url: '/' };
    }
    const indexPath = resolve(config.contentDir, 'quran/index.json');
    if (!quranChapters && existsSync(indexPath))
        quranChapters = JSON.parse(readFileSync(indexPath, 'utf8')).chapters;
    let surah = 1, ayah = 1, offset = number % 6236;
    for (const chapter of quranChapters || []) {
        if (offset < chapter.count) {
            surah = chapter.id;
            ayah = offset + 1;
            break;
        }
        offset -= chapter.count;
    }
    return { title: 'Your daily Quran ayah', body: `Take a moment to reflect on Qur’an ${surah}:${ayah}, with English translation.`, url: `/quran/${surah}?ayah=${ayah}` };
}
export async function enqueueForUser(userId, now = Date.now()) {
    const p = await preferences(userId), location = await locationFor(userId);
    const generation=(await get('SELECT generation FROM app_workflows WHERE user_id=?',userId))?.generation;
    if (!(await all('SELECT id FROM app_push WHERE user_id=?', userId)).length)
        return;
    if (!await get('SELECT u.id FROM user u JOIN app_profiles p ON p.user_id=u.id WHERE u.id=? AND u.emailVerified=1 AND p.privacy_version=?', userId, config.privacyVersion))
        return;
    for (let offset = -1; offset <= 2; offset++) {
        const day = DateTime.fromMillis(now, { zone: p.timezone }).plus({ days: offset }).toISODate();
        const schedule = dailySchedule(day, p.timezone, p.hadithTime);
        for (const kind of ['hadith', 'ayah'])
            if (p[kind])
                await insertJob(userId, kind, schedule[kind], { ...content(kind, day), generation, vibration: p.vibration, tag: `${kind}-${day}` }, now);
        if (p.prayers && location) {
            const prayerDay = DateTime.fromMillis(now, { zone: location.timezone }).plus({ days: offset }).toISODate();
            const times = calculatePrayerTimes({ ...location, method: p.method, school: p.school, date: prayerDay });
            for (const row of times.rows.filter(x => x.name !== 'sunrise' && x.time))
                await insertJob(userId, `prayer:${row.name}`, Date.parse(row.time), { generation, title: `${row.name[0].toUpperCase() + row.name.slice(1)} prayer time`, body: `Prayer time for ${location.label || 'your saved location'}.`, url: '/prayers', vibration: p.vibration, tag: `prayer-${prayerDay}-${row.name}` }, now);
        }
    }
}
async function insertJob(userId, kind, due, payload, now) { if (due < now - 15 * 60000 || due > now + 3 * 86400000)
    return; await run("INSERT INTO app_jobs(id,user_id,kind,due_at,payload,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,kind,due_at) DO UPDATE SET payload=excluded.payload,status='pending',attempts=0,lease_until=0 WHERE app_jobs.status='cancelled'", randomUUID(), userId, kind, due, JSON.stringify(payload), now); }
export async function resetSchedule(userId) {
 const generation=await newScheduleGeneration(userId)
 await run("UPDATE app_jobs SET status='cancelled' WHERE user_id=? AND status IN ('pending','processing')",userId)
 await enqueueForUser(userId)
 await startSchedule(userId,generation)
}
export async function sendToSubscription(subscription, payload) { return webpush.sendNotification(JSON.parse(subscription.subscription), JSON.stringify(payload), { TTL: payload.tag?.startsWith('prayer-') ? 120 : 3600, urgency: 'normal', timeout: 10000 }); }
const active = new Set();
let lastPlanning = 0;
export async function processJobs(now = Date.now(), send = sendToSubscription,onlyUser=null) {
    const lock=onlyUser||'all';
    if (active.has(lock))
        return;
    active.add(lock);
    try {
        if(onlyUser)await enqueueForUser(onlyUser,now);
        else if (now - lastPlanning > 30 * 60000) {
            for (const row of await all('SELECT user_id FROM app_reminders'))
                await enqueueForUser(row.user_id, now);
            lastPlanning = now;
        }
        await run("UPDATE app_jobs SET status='expired' WHERE status IN ('pending','processing') AND due_at<?", now - 15 * 60000);
        const jobs = onlyUser?await all("SELECT * FROM app_jobs WHERE user_id=? AND due_at<=? AND attempts<3 AND (status='pending' OR(status='processing' AND lease_until<?)) ORDER BY due_at LIMIT 30",onlyUser,now,now):await all("SELECT * FROM app_jobs WHERE due_at<=? AND attempts<3 AND (status='pending' OR(status='processing' AND lease_until<?)) ORDER BY due_at LIMIT 30",now,now);
        for (const job of jobs) {
            const claimed = await run("UPDATE app_jobs SET status='processing',lease_until=?,attempts=attempts+1 WHERE id=? AND(status='pending' OR(status='processing' AND lease_until<?))", now + 60000, job.id, now);
            if (!Number(claimed.changes))
                continue;
            const p = await preferences(job.user_id), payload = JSON.parse(job.payload);
            if(payload.generation&&(await get('SELECT generation FROM app_workflows WHERE user_id=?',job.user_id))?.generation!==payload.generation){await run("UPDATE app_jobs SET status='cancelled' WHERE id=?",job.id);continue}
            if ((await get('SELECT privacy_version FROM app_profiles WHERE user_id=?', job.user_id))?.privacy_version !== config.privacyVersion) {
                await run("UPDATE app_jobs SET status='cancelled' WHERE id=?", job.id);
                continue;
            }
            if (!(job.kind.startsWith('prayer:') ? p.prayers : p[job.kind])) {
                await run("UPDATE app_jobs SET status='cancelled' WHERE id=?", job.id);
                continue;
            }
            let failed = false;
            for (const subscription of await all('SELECT * FROM app_push WHERE user_id=?', job.user_id)) {
                if ((await get('SELECT delivered_at FROM app_deliveries WHERE job_id=? AND subscription_id=?', job.id, subscription.id))?.delivered_at)
                    continue;
                try {
                    await send(subscription, payload);
                    await run('INSERT INTO app_deliveries(job_id,subscription_id,delivered_at,attempts) VALUES(?,?,?,1) ON CONFLICT(job_id,subscription_id) DO UPDATE SET delivered_at=excluded.delivered_at,attempts=attempts+1', job.id, subscription.id, now);
                }
                catch (error) {
                    if ([404, 410].includes(error.statusCode))
                        await run('DELETE FROM app_push WHERE id=?', subscription.id);
                    else
                        failed = true;
                }
            }
            await run('UPDATE app_jobs SET status=?,lease_until=? WHERE id=?', failed ? (job.attempts >= 2 ? 'failed' : 'processing') : 'sent', failed ? now + 60000 : 0, job.id);
        }
        await run("DELETE FROM app_jobs WHERE due_at<?", now - 30 * 86400000);
    }
    finally {
        active.delete(lock);
    }
}
