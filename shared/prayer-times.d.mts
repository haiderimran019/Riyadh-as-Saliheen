export const methods:string[]
export function validZone(zone:string):boolean
export type PrayerInput={latitude:number;longitude:number;timezone:string;method?:string;school?:string;date?:string}
export type PrayerResult={date:string;timezone:string;method:string;school:string;rows:Array<{name:string;time:string|null}>}
export function calculatePrayerTimes(input:PrayerInput):PrayerResult
export function dailySchedule(dayISO:string,zone:string,hadithTime:string):{hadith:number;ayah:number}
