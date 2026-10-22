import { createHash } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { APIError,createAuthMiddleware } from 'better-auth/api'
import { getMigrations } from 'better-auth/db/migration'
import { config, authSecret } from './config.mjs'
import { db, run, transaction, migrateApplication, recordConsent } from './database.mjs'
import { sendAccountMail,purgeLocalMail } from './mail.mjs'
const accountAttempts=new Map()
const attemptsCleanup=setInterval(()=>{const now=Date.now();for(const [key,x]of accountAttempts)if(x.until<now)accountAttempts.delete(key)},60000);attemptsCleanup.unref()
export const auth = betterAuth({
  appName:'Riyad as-Salihin', baseURL:config.origin, basePath:'/api/auth', secret:authSecret, database:db,
  trustedOrigins:[config.origin],
  emailAndPassword:{ enabled:true, minPasswordLength:12, maxPasswordLength:128, requireEmailVerification:true, revokeSessionsOnPasswordReset:true, sendResetPassword:async ({user,url}) => sendAccountMail(user.email,'Reset your Riyad password',url) },
  emailVerification:{ sendOnSignUp:true, autoSignInAfterVerification:true, expiresIn:3600, sendVerificationEmail:async ({user,url}) => sendAccountMail(user.email,'Verify your Riyad email',url) },
  socialProviders:config.googleEnabled ? {google:{clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET,disableImplicitSignUp:false,accessType:'online',mapProfileToUser:()=>({image:null})}} : {},
  user:{ deleteUser:{enabled:true,afterDelete:async user=>purgeLocalMail(user.email)}, changeEmail:{enabled:false}, additionalFields:{privacyAccepted:{type:'boolean',required:false,defaultValue:false,input:true}} },
  account:{ encryptOAuthTokens:true,accountLinking:{enabled:true,requireLocalEmailVerified:true,allowDifferentEmails:false} },
  session:{ expiresIn:60*60*24*7, updateAge:60*60*24, storeSessionInDatabase:true },
  rateLimit:{enabled:true,window:60,max:config.production?50:500,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3},'/request-password-reset':{window:60,max:3},'/send-verification-email':{window:60,max:3}}},
  advanced:{ useSecureCookies:config.production, defaultCookieAttributes:{httpOnly:true,sameSite:'lax',secure:config.production}, ipAddress:{disableIpTracking:true} },
  hooks:{before:createAuthMiddleware(async ctx=>{if(ctx.path==='/sign-in/email'&&typeof ctx.body?.email==='string'){const key=createHash('sha256').update(ctx.body.email.trim().toLowerCase()).digest('hex'),now=Date.now(),attempt=accountAttempts.get(key);if(attempt&&attempt.until>now){if(++attempt.count>12)throw new APIError('TOO_MANY_REQUESTS',{message:'Please wait before trying to sign in again.'})}else if(accountAttempts.size<5000)accountAttempts.set(key,{count:1,until:now+15*60000});else throw new APIError('TOO_MANY_REQUESTS',{message:'Please try again shortly.'})}if(ctx.path==='/sign-up/email'&&ctx.body?.privacyAccepted!==true)throw new APIError('BAD_REQUEST',{message:'Please accept the account privacy notice.'})})},
  databaseHooks:{ user:{ create:{before:async (user) => {
    const name=user.name?.trim()
    if (!name || name.length > 100 || /[\x00-\x1f]/u.test(name)) throw new Error('Enter a name with 1–100 characters.')
    return {data:{...user,name,privacyAccepted:!!user.privacyAccepted}}
  }, after:async (user) => {
    transaction(() => { run('INSERT INTO app_profiles(user_id,is_owner,privacy_version,accepted_at,created_at) VALUES(?,0,?,?,?)',user.id,user.privacyAccepted?config.privacyVersion:'',user.privacyAccepted?Date.now():null,Date.now());if(user.privacyAccepted)recordConsent(user.id,'account',true) })
  } } } },
  logger:{level:'error'},
})
export async function migrateAuth() { const {runMigrations}=await getMigrations(auth.options);await runMigrations();migrateApplication() }
