import { z } from 'zod'
import { all, get, run, transaction, recordConsent, postgres } from './database.mjs'
import { config } from './config.mjs'
import { validZone } from './prayer.mjs'

const pages = ['home','quran','hadith','library','prayers','saved','search','settings','account','reminders','about','sources','privacy','terms','admin']
export const controls = ['navigation','reading.more','quran.translation','quran.script','quran.view','quran.bookmark','quran.page','hadith.bookmark','hadith.page','location.request','location.save','location.stop','reminders.save','reminders.connect','account.export','analytics.allow','analytics.decline']
const flows = ['','location','reminders','reading_settings']
const eventSchema = z.object({ id: z.string().uuid(), type: z.enum(['page.view','control.click','flow.started','flow.completed','flow.skipped']), page: z.enum(pages), control: z.enum(['', ...controls]).default(''), flow: z.enum(flows).default('') }).strict()
const payloadSchema = z.object({ sessionId: z.string().uuid(), activeMs: z.number().int().min(0).max(60000), ended: z.boolean().default(false), events: z.array(eventSchema).max(30), timezone: z.string().refine(validZone), language: z.enum(['en','ur','ar','bn']) }).strict()
export async function analyticsEnabled(id) { const row = await get('SELECT enabled,version FROM app_analytics_consent WHERE user_id=?', id); return row?.enabled === 1 && row.version === config.privacyVersion }
export async function setAnalytics(id, enabled) {
  await transaction(async () => {
    await run('INSERT INTO app_analytics_consent(user_id,enabled,version,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,version=excluded.version,updated_at=excluded.updated_at', id, +enabled, config.privacyVersion, Date.now())
    await recordConsent(id, 'usage_analytics', enabled)
    // Withdrawal deletes the previous optional usage history as well.
    if (!enabled) await run('DELETE FROM app_usage_sessions WHERE user_id=?', id)
  })
}
export async function receiveUsage(userId, body) {
  const data = payloadSchema.parse(body)
  if (!await analyticsEnabled(userId)) return false
  await transaction(async () => {
    // Recheck inside the transaction, so withdrawal cannot race a queued write.
    if(postgres)await get('SELECT enabled FROM app_analytics_consent WHERE user_id=? FOR UPDATE',userId)
    if (!await analyticsEnabled(userId)) return
    const now = Date.now(), old = await get('SELECT * FROM app_usage_sessions WHERE id=?', data.sessionId)
    if (old && old.user_id !== userId) throw new Error('Invalid usage session.')
    if (!old) await run('INSERT INTO app_usage_sessions(id,user_id,started_at,last_seen,active_ms,timezone,language) VALUES(?,?,?,?,0,?,?)', data.sessionId, userId, now, now, data.timezone, data.language)
    const increment = old ? Math.min(data.activeMs, Math.max(0, now - old.last_seen) + 1000) : 0
    await run('UPDATE app_usage_sessions SET last_seen=?,active_ms=active_ms+?,ended_at=?,language=? WHERE id=? AND user_id=?', now, increment, data.ended ? now : null, data.language, data.sessionId, userId)
    for (const [index,event] of data.events.entries()) await run('INSERT INTO app_usage_events(id,user_id,session_id,event_type,page,control,flow,occurred_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING', event.id, userId, data.sessionId, event.type, event.page, event.control, event.flow, now-data.events.length+index)
  })
  return true
}
export async function usageInventory(id) { return { sessions: await all('SELECT id,started_at,last_seen,active_ms,ended_at,timezone,language FROM app_usage_sessions WHERE user_id=? ORDER BY started_at DESC', id), events: await all('SELECT session_id,event_type,page,control,flow,occurred_at FROM app_usage_events WHERE user_id=? ORDER BY occurred_at DESC', id) } }
export async function usageSummary(days, timezone) {
  const since = Date.now() - days * 86400000
  const sessions = await all('SELECT id,user_id,started_at,last_seen,active_ms,ended_at FROM app_usage_sessions WHERE started_at>=? ORDER BY started_at DESC LIMIT 50000', since)
  const events = await all('SELECT session_id,event_type,page,control,flow,occurred_at FROM app_usage_events WHERE occurred_at>=? ORDER BY occurred_at LIMIT 100000', since)
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, launches: 0 })), pageCounts = {}, clickCounts = {}, paths = {}, lastPage = {}, flowStats = {}, running = new Map()
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' })
  for (const session of sessions) hours[Number(format.format(session.started_at))].launches++
  for (const event of events) {
    if (event.event_type === 'page.view') { pageCounts[event.page] = (pageCounts[event.page] || 0) + 1; const from = lastPage[event.session_id]; if (from && from !== event.page) { const path = `${from} → ${event.page}`; paths[path] = (paths[path] || 0) + 1 } lastPage[event.session_id] = event.page }
    if (event.event_type === 'control.click' && event.control) clickCounts[event.control] = (clickCounts[event.control] || 0) + 1
    if (event.flow) {
      const row = flowStats[event.flow] ||= { flow: event.flow, started: 0, completed: 0, skipped: 0, abandoned: 0 }
      const key = `${event.session_id}:${event.flow}`
      if (event.event_type === 'flow.started') { row.started++; running.set(key, event) }
      if (event.event_type === 'flow.completed') { row.completed++; running.delete(key) }
      if (event.event_type === 'flow.skipped') { row.skipped++; running.delete(key) }
    }
  }
  for (const event of running.values()) { const session = sessions.find(x => x.id === event.session_id); if (!session || session.ended_at || session.last_seen < Date.now() - 1800000) flowStats[event.flow].abandoned++ }
  const names=new Map((await all('SELECT id,name FROM user')).map(x=>[x.id,x.name])),frequency=new Map()
  for(const x of sessions){const row=frequency.get(x.user_id)||{userId:x.user_id,name:names.get(x.user_id)||'',sessions:0,activeMs:0,elapsedMs:0,lastSeen:0};row.sessions++;row.activeMs+=x.active_ms;row.elapsedMs+=Math.max(0,(x.ended_at||x.last_seen)-x.started_at);row.lastSeen=Math.max(row.lastSeen,x.last_seen);frequency.set(x.user_id,row)}
  const rank = object => Object.entries(object).map(([name,count]) => ({name,count})).sort((a,b) => b.count-a.count)
  return { frequency:[...frequency.values()].sort((a,b)=>b.sessions-a.sessions),recent:sessions.slice(0,20).map(x=>({name:names.get(x.user_id)||'',startedAt:x.started_at,endedAt:x.ended_at,lastSeen:x.last_seen,activeMs:x.active_ms,elapsedMs:Math.max(0,(x.ended_at||x.last_seen)-x.started_at)})), days, timezone, sessions: sessions.length, readers: new Set(sessions.map(x=>x.user_id)).size, activeMs: sessions.reduce((sum,x)=>sum+x.active_ms,0), elapsedMs: sessions.reduce((sum,x)=>sum+Math.max(0,(x.ended_at||x.last_seen)-x.started_at),0), hours, pages: rank(pageCounts), controls: rank(clickCounts), paths: rank(paths), funnels: Object.values(flowStats), partial: sessions.length === 50000 || events.length === 100000, retentionDays: 30, scope: 'Only readers who opted into usage analytics. Active time counts visible, recently active app time; browser closure delivery is best effort.' }
}
export async function cleanupUsage() { await run('DELETE FROM app_usage_sessions WHERE started_at<?', Date.now() - 30 * 86400000) }
