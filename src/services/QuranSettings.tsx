import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { quranEditions, defaultEdition } from '../../shared/quran-editions.mjs'
import { getSetting, setSetting } from '../data/db'
import { useI18n } from '../i18n'
export type QuranPreferences={edition:string;script:'uthmani'|'indopak';mode:'verses'|'mushaf';showTranslation:boolean}
const defaults:QuranPreferences={edition:'english_saheeh',script:'uthmani',mode:'verses',showTranslation:true}
const Context=createContext<{preferences:QuranPreferences;update:(value:Partial<QuranPreferences>)=>void}>({preferences:defaults,update:(_value:Partial<QuranPreferences>)=>undefined})
export function QuranSettingsProvider({children}:{children:ReactNode}){
  const {language}=useI18n(),[preferences,setPreferences]=useState(defaults),[custom,setCustom]=useState(false),[loaded,setLoaded]=useState(false)
  useEffect(()=>{let active=true;void Promise.all([getSetting('quran-translation-edition',''),getSetting<string>('quran-script','uthmani'),getSetting<string>('quran-reading-mode','verses'),getSetting('quran-english',true)]).then(([edition,script,mode,showTranslation])=>{if(!active)return;const known=quranEditions.some(x=>x.key===edition);setCustom(known);setPreferences({edition:known?edition:defaultEdition(language),script:script==='indopak'?'indopak':'uthmani',mode:mode==='mushaf'?'mushaf':'verses',showTranslation});setLoaded(true)}).catch(()=>setLoaded(true));return()=>{active=false}},[])
  useEffect(()=>{if(loaded&&!custom)setPreferences(value=>({...value,edition:defaultEdition(language)}))},[language,loaded,custom])
  function update(value:Partial<QuranPreferences>){setPreferences(old=>({...old,...value}));if(value.edition){setCustom(true);void setSetting('quran-translation-edition',value.edition)}if(value.script)void setSetting('quran-script',value.script);if(value.mode)void setSetting('quran-reading-mode',value.mode);if(value.showTranslation!==undefined)void setSetting('quran-english',value.showTranslation)}
  return <Context.Provider value={{preferences,update}}>{children}</Context.Provider>
}
export const useQuranSettings=()=>useContext(Context)
