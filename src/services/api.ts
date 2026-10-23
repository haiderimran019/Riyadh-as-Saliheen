export class ApiError extends Error { constructor(message:string, public status:number, public code?:string) { super(message) } }
export async function api<T>(path:string, options:RequestInit = {}):Promise<T> {
  const response=await fetch(`/api${path}`,{credentials:'same-origin',...options,headers:{...(options.body ? {'Content-Type':'application/json'} : {}),...options.headers}})
  const value=await response.json().catch(()=>({error:'The server returned an unreadable response.'}))
  if(!response.ok)throw new ApiError(typeof value.error==='string'?value.error:value.message||'This request could not be completed.',response.status,value.code)
  return value as T
}
export const jsonBody=(value:unknown)=>JSON.stringify(value)
export type ReminderPreferences={hadith:boolean;ayah:boolean;prayers:boolean;vibration:boolean;hadithTime:string;timezone:string;method:string;school:'standard'|'hanafi'}
export type SavedLocation={latitude:number;longitude:number;label:string;timezone:string;source:'gps'|'manual';updatedAt?:number;accuracy?:number|null;precision?:'precise'|'approximate';live?:boolean}
export type AccountData={user:{id:string;name:string;email:string;emailVerified:boolean};owner:boolean;googleConnected?:boolean;analyticsEnabled?:boolean;analyticsHasHistory?:boolean;analyticsChoiceMade?:boolean;privacyVersion:string;location:SavedLocation|null;preferences:ReminderPreferences;preferencesSaved:boolean;devices:Array<{id:string;created_at:number}>;consents:Array<{purpose:string;granted:number;version:string;recorded_at:number}>}
export type Capabilities={ok:boolean;googleEnabled:boolean;emailPasswordEnabled?:boolean;requireGoogleSignIn?:boolean;emailDelivery:'smtp'|'local-outbox'|'unavailable';pushPublicKey:string;privacyVersion:string}
export const browserTimezone=()=>typeof window==='undefined'?'UTC':Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
export const prayerMethods=[['MuslimWorldLeague','Muslim World League'],['Karachi','University of Islamic Sciences, Karachi'],['NorthAmerica','North America (ISNA)'],['UmmAlQura','Umm al-Qura, Makkah'],['Egyptian','Egyptian General Authority'],['MoonsightingCommittee','Moonsighting Committee'],['Dubai','Dubai'],['Singapore','Singapore'],['Turkey','Turkey']] as const
export function dateInZone(zone:string) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return `${parts.find(x=>x.type==='year')!.value}-${parts.find(x=>x.type==='month')!.value}-${parts.find(x=>x.type==='day')!.value}` }
