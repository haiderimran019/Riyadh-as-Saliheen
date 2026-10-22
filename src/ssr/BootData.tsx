import { createContext,useContext,type ReactNode } from 'react'
import type { ArabicChapterDataset,CollectionIndex,DailyQuranDataset,TranslationChapterDataset } from '../types/hadith'
import type { SearchableHadith } from '../search'
import type { Capabilities } from '../services/api'
export type QuranIndex={publisher:string;sourceUrl:string;edition:{title:string;version:string;key:string};ayahCount:number;chapters:Array<{id:number;name:string;arabic:string;meaning:string;count:number}>}
export type QuranSura={metadata:{publisher:string;sourceUrl:string;edition:QuranIndex['edition']};result:Array<{id:string;sura:string;aya:string;arabic_text:string;translation:string;footnotes:string}>}
export type BootData={basePath?:string;pathname?:string;now?:string;origin?:string;collection?:CollectionIndex;chapter?:ArabicChapterDataset;chapterId?:string;hadithId?:string;translation?:TranslationChapterDataset;dailyHadith?:SearchableHadith;dailyTranslation?:TranslationChapterDataset;dailyQuran?:DailyQuranDataset;quranIndex?:QuranIndex;quranSurah?:QuranSura;capabilities?:Capabilities;status?:number;seo?:{title:string;description:string;canonical:string;robots:string}}
const Context=createContext<BootData>({})
export function BootProvider({data,children}:{data:BootData;children:ReactNode}){return <Context.Provider value={data}>{children}</Context.Provider>}
export const useBootData=()=>useContext(Context)
export function readBootData():BootData{const element=document.getElementById('riyad-bootstrap');return element?.textContent?JSON.parse(element.textContent):{}}
