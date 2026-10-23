import { expect,test } from 'vitest'
import { readFileSync,readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { translateUI,uiTranslations } from './i18n'

function files(root:string):string[]{return readdirSync(root,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(resolve(root,x.name)):/\.tsx?$/.test(x.name)&&!x.name.includes('.test.')?[resolve(root,x.name)]:[])}
test('every literal interface message is available in Arabic, Bengali and Urdu',()=>{
 const keys=new Set<string>()
 for(const path of files(resolve('src'))){
  const file=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  const messages=(node:ts.Node)=>{if(ts.isStringLiteralLike(node))keys.add(node.text);else if(ts.isConditionalExpression(node)){messages(node.whenTrue);messages(node.whenFalse)}}
  const visit=(node:ts.Node)=>{if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='t'&&node.arguments[0])messages(node.arguments[0]);ts.forEachChild(node,visit)}
  visit(file)
 }
 for(const language of ['ar','bn','ur'] as const){const missing=[...keys].filter(x=>!uiTranslations[language][x]);expect(missing,`${language} missing messages`).toEqual([])}
 expect(translateUI('ar','Today')).toBe('اليوم')
 expect(translateUI('bn','Today')).toBe('আজ')
 expect(translateUI('ur','Today')).toBe('آج')
})
