import { afterEach,expect,test,vi } from 'vitest'

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.resetModules()})

test('Pages Quran reads use imported data under the repository subpath',async()=>{
  vi.stubEnv('VITE_STATIC_READING','true');vi.stubEnv('VITE_DATA_MODE','real');vi.stubEnv('BASE_URL','/Riyadh-as-Saliheen/');vi.resetModules()
  const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({result:[]})});vi.stubGlobal('fetch',fetcher)
  const {quranIndex,quranSurah}=await import('./reading')
  await quranIndex();await quranSurah(114)
  expect(fetcher.mock.calls.map(x=>x[0])).toEqual(['/Riyadh-as-Saliheen/data-local/generated/quran/index.json','/Riyadh-as-Saliheen/data-local/generated/quran/114.json'])
  await expect(quranSurah(115)).rejects.toThrow('1 to 114');expect(fetcher).toHaveBeenCalledTimes(2)
})

test('Pages prayer calculations never transmit coordinates to a server',async()=>{
  vi.stubEnv('VITE_STATIC_READING','true');vi.resetModules();const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher)
  const {prayerTimes}=await import('./reading')
  const times=await prayerTimes({latitude:24.8607,longitude:67.0011,timezone:'Asia/Karachi',method:'Karachi',school:'hanafi',date:'2026-10-22'})
  expect(times.rows).toHaveLength(6);expect(times.timezone).toBe('Asia/Karachi');expect(times.rows.every(x=>x.time&&Number.isFinite(Date.parse(x.time)))).toBe(true);expect(fetcher).not.toHaveBeenCalled()
})
