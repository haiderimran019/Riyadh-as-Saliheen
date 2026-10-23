import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import {AppLocaleProvider} from '../i18n'
import {LanguagePicker} from '../components/LanguagePicker'
const state=vi.hoisted(()=>({resolve:(_value:string)=>undefined as unknown,get:vi.fn(),set:vi.fn()}))
vi.mock('../data/db',()=>({getSetting:()=>new Promise<string>(resolve=>{state.resolve=resolve}),setSetting:state.set}))
afterEach(cleanup)
test('an explicit language choice survives a delayed saved preference and supports Arabic direction',async()=>{
 render(<AppLocaleProvider><LanguagePicker/></AppLocaleProvider>)
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'bn'}})
 await act(async()=>state.resolve('en'))
 expect(screen.getByRole('combobox')).toHaveValue('bn')
 expect(document.documentElement.lang).toBe('bn')
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'ar'}})
 expect(screen.getByRole('combobox')).toHaveValue('ar')
 expect(document.documentElement.dir).toBe('rtl')
})
