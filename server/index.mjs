import {createApplication} from './app.mjs'
import {migrateAuth} from './auth.mjs'
import {processJobs} from './push.mjs'
import {purgeLocalMail} from './mail.mjs'
import {config} from './config.mjs'
await migrateAuth()
const app=createApplication()
const server=app.listen(config.port,config.host,()=>console.log(`Riyad API listening on ${config.host}:${config.port}; mail: ${config.smtpEnabled?'SMTP':'private local outbox'}`))
server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000
const mailTimer=setInterval(()=>{void purgeLocalMail('').catch(()=>undefined)},30*60000);mailTimer.unref()
const timer=setInterval(()=>{void processJobs().catch(()=>console.error('Reminder processing failed; retrying on the next tick.'))},15000);timer.unref()
void processJobs().catch(()=>undefined)
function close(){clearInterval(timer);clearInterval(mailTimer);server.close(()=>process.exit(0))}
process.on('SIGINT',close);process.on('SIGTERM',close)
