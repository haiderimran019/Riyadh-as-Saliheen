import { config } from '../server/config.mjs';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const action = process.argv[2];
if (action === 'verify') {
    if (config.production || config.smtpEnabled)
        throw new Error('Local verification is available only in development without SMTP. Use your email inbox on a hosted service.');
    const requested = process.argv[3]?.trim().toLowerCase();
    if (!requested || !requested.includes('@'))
        throw new Error('Provide your own account email: npm run mail:verify -- your-email@example.com');
    const folder = resolve(config.dataDir, 'mail'), files = existsSync(folder) ? readdirSync(folder).filter(x => x.endsWith('.json')).sort() : [];
    const mails = files.map(x => JSON.parse(readFileSync(resolve(folder, x), 'utf8'))).filter(x => {
        try {
            const url = new URL(x.url);
            return x.to.toLowerCase() === requested && url.origin === config.origin && url.pathname === '/api/auth/verify-email';
        }
        catch {
            return false;
        }
    });
    const latest = mails.at(-1);
    if (!latest || latest.createdAt < Date.now() - 3600000)
        throw new Error('No current verification link. Request a new one from Account → Already registered but not verified? → Resend verification email.');
    if (process.platform !== 'darwin' && process.platform !== 'linux')
        throw new Error('Use npm run mail:latest to open your own link manually on this platform.');
    console.log(`Opening the local verification message for ${requested} in your default browser. The private link is not printed.`);
    const child = spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [latest.url], { stdio: 'ignore' });
    await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error('The browser could not be opened.'))); });
}
else if (action === 'mail') {
    const folder = resolve(config.dataDir, 'mail');
    const files = existsSync(folder) ? readdirSync(folder).filter(x => x.endsWith('.json')).sort() : [];
    const requested = process.argv[3];
    const mails = files.map(x => JSON.parse(readFileSync(resolve(folder, x), 'utf8'))).filter(x => !requested || x.to.toLowerCase() === requested.toLowerCase());
    const latest = mails.at(-1);
    if (!latest) {
        console.log('No local account mail found.');
        process.exit(1);
    }
    console.log(`To: ${latest.to}\n${latest.subject}\n\n${latest.url}\n\nThis link is private. Open it only for your own account; do not share it.`);
}
else if (action === 'grant') {
    if (!config.ownerEmail)
        throw new Error('Set RIYAD_OWNER_EMAIL in server/.env.local first.');
    const { get, run } = await import('../server/database.mjs');
    const user = await get('SELECT id,email,emailVerified FROM user WHERE lower(email)=?', config.ownerEmail);
    if (!user)
        throw new Error('Create the owner account in the app first.');
    if (!user.emailVerified)
        throw new Error('Verify the owner email before granting access.');
    const profile = await get('SELECT privacy_version FROM app_profiles WHERE user_id=?', user.id);
    if (profile?.privacy_version !== config.privacyVersion)
        throw new Error('Accept the current privacy notice in the app first.');
    await run('UPDATE app_profiles SET is_owner=1 WHERE user_id=?', user.id);
    console.log(`Owner access granted to verified account ${user.email}. Refresh the Account page to open the owner dashboard.`);
}
else {
    console.error('Use npm run mail:verify -- email, npm run mail:latest [-- email], or npm run owner:grant.');
    process.exit(1);
}
