import {sleep} from 'workflow'
import {start} from 'workflow/api'
import {nextReminder,dispatchReminder} from '../server/workflow-steps.mjs'

export async function reminderCycle(userId,generation){
 'use workflow'
 // Bound each run; the next run retains only opaque account/schedule IDs.
 for(let index=0;index<140;index++){
  const next=await nextReminder(userId,generation)
  if(next.stopped)return
  await sleep(new Date(next.at))
  if(next.jobId)await dispatchReminder(userId,generation,next.jobId)
 }
 await start(reminderCycle,[userId,generation],{experimental_retention:0})
}
