import { STATIC_READING,getDataRoot } from '../config'
import { api } from './api'
import type { QuranIndex,QuranSura } from '../ssr/BootData'
import type { PrayerInput,PrayerResult } from '../../shared/prayer-times.mjs'
async function source<T>(file:string):Promise<T>{
  const response=await fetch(`${getDataRoot()}/${file}`)
  if(!response.ok)throw new Error('This reading could not be loaded. Please try again.')
  return response.json() as Promise<T>
}
export const quranIndex=()=>STATIC_READING?source<QuranIndex>('quran/index.json'):api<QuranIndex>('/quran')
export function quranSurah(id:number){if(!Number.isInteger(id)||id<1||id>114)return Promise.reject(new Error('Choose a surah from 1 to 114.'));return STATIC_READING?source<QuranSura>(`quran/${id}.json`):api<QuranSura>(`/quran/${id}`)}
export async function prayerTimes(input:PrayerInput):Promise<PrayerResult>{
  if(STATIC_READING){const {calculatePrayerTimes}=await import('../../shared/prayer-times.mjs');return calculatePrayerTimes(input)}
  return api<PrayerResult>('/prayers',{method:'POST',body:JSON.stringify(input)})
}
