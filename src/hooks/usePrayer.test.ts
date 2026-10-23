import {expect,test} from 'vitest'
import {activePrayer} from './usePrayer'
import {calculatePrayerTimes} from '../../shared/prayer-times.mjs'
const input={latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi',method:'Karachi',school:'standard'}
const yesterday=calculatePrayerTimes({...input,date:'2026-10-22'}),today=calculatePrayerTimes({...input,date:'2026-10-23'}),tomorrow=calculatePrayerTimes({...input,date:'2026-10-24'})
test('current prayer crosses midnight and sunrise correctly without inventing a prayer',()=>{
 const beforeFajr=Date.parse(today.rows[0].time!)-60000
 expect(activePrayer(today,yesterday,tomorrow,beforeFajr)?.name).toBe('isha')
 const sunrise=Date.parse(today.rows.find(x=>x.name==='sunrise')!.time!)
 expect(activePrayer(today,yesterday,tomorrow,sunrise+60000)).toMatchObject({name:'dhuhr',mode:'Next prayer'})
 const asr=Date.parse(today.rows.find(x=>x.name==='asr')!.time!)
 expect(activePrayer(today,yesterday,tomorrow,asr+60000)).toMatchObject({name:'asr',mode:'Current prayer'})
})
test('Hanafi changes Asr later while the other prayer instants remain consistent',()=>{
 const hanafi=calculatePrayerTimes({...input,school:'hanafi',date:'2026-10-23'})
 for(const row of today.rows){const other=hanafi.rows.find(x=>x.name===row.name)!;if(row.name==='asr')expect(Date.parse(other.time!)).toBeGreaterThan(Date.parse(row.time!));else expect(other.time).toBe(row.time)}
})
