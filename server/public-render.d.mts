import type { BootData } from '../src/ssr/BootData'
export type RenderOptions={origin:string;contentDir:string;basePath?:string;capabilities?:import('../src/services/api').Capabilities;indexable?:boolean;now?:Date}
export function publicBoot(url:string,options:RenderOptions):BootData
export function renderDocument(template:string,markup:string,data:BootData,nonce:string):string
export function sitemap(options:RenderOptions):string
