// Run only against the explicitly configured cloud database; never upload the
// local SQLite account file or use the pooled transaction connection for DDL.
if(!process.env.DATABASE_URL)throw new Error('Select the cloud database environment before migration.')
process.env.RIYAD_SKIP_ENV_FILE='1'
process.env.RIYAD_SERVERLESS='1'
process.env.DATABASE_URL=process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL
const {migrateAuth}=await import('../server/auth.mjs')
const {closeDatabase}=await import('../server/database.mjs')
try{await migrateAuth();console.log('Cloud account schema is current.')}finally{await closeDatabase()}
