import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { pageSeo } from '../../shared/seo.mjs'
import { useBootData } from './BootData'
export function Seo(){const location=useLocation(),boot=useBootData();useEffect(()=>{
 const seo=pageSeo(location.pathname+location.search,boot,boot.seo?.robots.startsWith('index')||(!boot.seo&&!['localhost','127.0.0.1'].includes(window.location.hostname)))
 document.title=seo.title
 const set=(key:string,value:string,property=false)=>{const selector=`meta[${property?'property':'name'}="${key}"]`;let tag=document.head.querySelector<HTMLMetaElement>(selector);if(!tag){tag=document.createElement('meta');tag.setAttribute(property?'property':'name',key);document.head.append(tag)}tag.content=value}
 set('description',seo.description);set('robots',seo.robots);set('og:title',seo.title,true);set('og:description',seo.description,true);set('og:url',seo.canonical,true);set('twitter:title',seo.title);set('twitter:description',seo.description)
 let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}canonical.href=seo.canonical
 const structured=document.getElementById('riyad-structured-data');if(structured&&boot.pathname!==location.pathname)structured.remove()
 },[location.pathname,location.search,boot]);return null}
