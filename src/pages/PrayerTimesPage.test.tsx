import {afterEach,expect,test,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {LocationProvider} from '../services/LocationContext'
import {PrayerTimesPage} from './PrayerTimesPage'
const native=vi.hoisted(()=>({watch:vi.fn(),clear:vi.fn()}))
vi.mock('../data/db',()=>({getSetting:async(_key:string,fallback:unknown)=>fallback,setSetting:async()=>undefined}))
vi.mock('../i18n',()=>({useI18n:()=>({language:'en',t:(text:string)=>text})}))
vi.mock('../services/AccountContext',()=>({useAccount:()=>({account:null,refresh:async()=>undefined})}))
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
test('GPS can be stopped before the device supplies a fix, including after a timeout',()=>{
 native.watch.mockReturnValue(17);vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:vi.fn(),watchPosition:native.watch,clearWatch:native.clear}})
 render(<MemoryRouter><LocationProvider><PrayerTimesPage/></LocationProvider></MemoryRouter>)
 fireEvent.click(screen.getAllByRole('button',{name:'Use my location'})[0])
 expect(screen.getByRole('button',{name:'Stop live GPS'})).toBeVisible()
 act(()=>native.watch.mock.calls[0][1]({code:3}))
 expect(screen.getByRole('alert')).toHaveTextContent('GPS is taking longer')
 fireEvent.click(screen.getByRole('button',{name:'Stop live GPS'}))
 expect(native.clear).toHaveBeenCalledWith(17)
 expect(screen.queryByRole('alert')).not.toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'Stop live GPS'})).not.toBeInTheDocument()
})
