import express from 'express'
import {createApplication} from './app.mjs'
import {assertSchema} from './database.mjs'
import {render} from '../.server-dist/entry-server.js'

const server=express(),app=createApplication({renderer:render})
let readiness
server.use(async(_req,res,next)=>{
 try{readiness||=assertSchema().catch(error=>{readiness=undefined;throw error});await readiness;next()}
 catch(error){console.error('Account service readiness failed:',error.code||error.name);res.status(503).json({error:'The account service is being prepared. Please try again shortly.'})}
})
server.use(app)
export default server
