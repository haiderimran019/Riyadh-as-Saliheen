import {test} from 'node:test'
import assert from 'node:assert/strict'
import {indopakSurah,indopakFont} from './quran-scripts.mjs'

test('IndoPak refuses incomplete, misnumbered or missing source text and validates matching font',async()=>{
 const original=globalThis.fetch
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>({verses:[{verse_key:'1:2',text_indopak_nastaleeq:'source'}]})})
  await assert.rejects(indopakSurah(1,7),/verified/)
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>Buffer.alloc(20000)})
  await assert.rejects(indopakFont(),/verified/)
  globalThis.fetch=async()=>({ok:true,json:async()=>({pagination:{next_page:null},verses:[{verse_key:'114:1',verse_number:1,text_indopak_nastaleeq:'source preserved'}]})})
  const value=await indopakSurah(114,1);assert.equal(value.result[0].text,'source preserved');assert.equal(value.fontVersion,'4.2.1');assert.match(value.credit,/Ayman Siddiqui/)
 }finally{globalThis.fetch=original}
})
