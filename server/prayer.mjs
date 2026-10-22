import { Coordinates, CalculationMethod, Madhab, PrayerTimes, HighLatitudeRule } from 'adhan'
import { DateTime } from 'luxon'
export const methods=['MuslimWorldLeague','Karachi','NorthAmerica','UmmAlQura','Egyptian','MoonsightingCommittee','Dubai','Singapore','Turkey']
export function validZone(zone) { return typeof zone==='string' && zone.length<80 && DateTime.now().setZone(zone).isValid }
export function calculatePrayerTimes({latitude,longitude,timezone,method='MuslimWorldLeague',school='standard',date}) {
  if (!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180||!validZone(timezone)||!methods.includes(method)||!['standard','hanafi'].includes(school)) throw new Error('Choose valid coordinates, timezone and calculation settings.')
  const day=date ? DateTime.fromISO(date,{zone:timezone}) : DateTime.now().setZone(timezone)
  if (!day.isValid) throw new Error('Choose a valid date.')
  const parameters=CalculationMethod[method]();parameters.madhab=school==='hanafi'?Madhab.Hanafi:Madhab.Shafi;parameters.highLatitudeRule=HighLatitudeRule.MiddleOfTheNight
  const times=new PrayerTimes(new Coordinates(latitude,longitude),new Date(day.year,day.month-1,day.day),parameters)
  const rows=['fajr','sunrise','dhuhr','asr','maghrib','isha'].map((name) => ({name,time:Number.isFinite(times[name]?.getTime())?times[name].toISOString():null}))
  return {date:day.toISODate(),timezone,method,school,rows}
}
export function dailySchedule(dayISO,zone,hadithTime) {
  const [hour,minute]=hadithTime.split(':').map(Number)
  const hadith=DateTime.fromISO(dayISO,{zone}).set({hour,minute,second:0,millisecond:0})
  return {hadith:hadith.toMillis(),ayah:hadith.plus({hours:5}).toMillis()}
}
