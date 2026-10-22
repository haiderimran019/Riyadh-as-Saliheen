import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { getMigrations } from 'better-auth/db/migration';
import { config, authSecret } from './config.mjs';
import { limitEmail } from './rate-limit.mjs';
import { db, run, transaction, migrateApplication, recordConsent } from './database.mjs';
import { sendAccountMail, purgeLocalMail } from './mail.mjs';
export const auth = betterAuth({
    appName: 'Riyad as-Salihin', baseURL: config.origin, basePath: '/api/auth', secret: authSecret, database: db,
    trustedOrigins: [config.origin],
    emailAndPassword: { enabled: config.emailPasswordEnabled, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: true, revokeSessionsOnPasswordReset: true, sendResetPassword: async ({ user, url }) => sendAccountMail(user.email, 'Reset your Riyad password', url) },
    emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: true, expiresIn: 3600, sendVerificationEmail: async ({ user, url }) => sendAccountMail(user.email, 'Verify your Riyad email', url) },
    socialProviders: config.googleEnabled ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, disableImplicitSignUp: false, accessType: 'online', mapProfileToUser: () => ({ image: null }) } } : {},
    user: { deleteUser: { enabled: true, afterDelete: async (user) => purgeLocalMail(user.email) }, changeEmail: { enabled: false }, additionalFields: { privacyAccepted: { type: 'boolean', required: false, defaultValue: false, input: true } } },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: true, requireLocalEmailVerified: true, allowDifferentEmails: false } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, storeSessionInDatabase: true },
    rateLimit: { enabled: true, window: 60, max: config.production ? 50 : 500, customRules: { '/sign-in/email': { window: 60, max: 5 }, '/sign-up/email': { window: 60, max: 3 }, '/request-password-reset': { window: 60, max: 3 }, '/send-verification-email': { window: 60, max: 3 } } },
    advanced: { useSecureCookies: config.production, defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.production }, ipAddress: { disableIpTracking: true } },
    hooks:{before:createAuthMiddleware(async ctx=>{
      if(ctx.path==='/sign-in/email'&&typeof ctx.body?.email==='string'&&!await limitEmail(ctx.body.email))throw new APIError('TOO_MANY_REQUESTS',{message:'Please wait before trying to sign in again.'})
      if(ctx.path==='/sign-up/email'&&ctx.body?.privacyAccepted!==true)throw new APIError('BAD_REQUEST',{message:'Please accept the account privacy notice.'})
      if(['/sign-in/social','/link-social'].includes(ctx.path)&&ctx.body?.scopes?.some(scope=>!['openid','email','profile'].includes(scope)))throw new APIError('BAD_REQUEST',{message:'Only basic Google sign-in permissions are supported.'})
    })},
    databaseHooks: { user: { create: { before: async (user) => {
                    const name = user.name?.trim();
                    if (!name || name.length > 100 || /[\x00-\x1f]/u.test(name))
                        throw new Error('Enter a name with 1–100 characters.');
                    return { data: { ...user, name, privacyAccepted: !!user.privacyAccepted } };
                }, after: async (user) => {
                    await transaction(async () => { await run('INSERT INTO app_profiles(user_id,is_owner,privacy_version,accepted_at,created_at) VALUES(?,0,?,?,?)', user.id, user.privacyAccepted ? config.privacyVersion : '', user.privacyAccepted ? Date.now() : null, Date.now()); if (user.privacyAccepted)
                        await recordConsent(user.id, 'account', true); });
                } } } },
    logger: { level: 'error' },
});
export async function migrateAuth() { const { runMigrations } = await getMigrations(auth.options); await runMigrations(); await migrateApplication(); }
