import {afterEach,expect,test,vi} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {HomePage} from './HomePage'
vi.mock('../i18n',()=>({useI18n:()=>({language:'en',t:(text:string)=>text})}))
vi.mock('../hooks/useShowDiacritics',()=>({useShowDiacritics:()=>true}))
vi.mock('../hooks/usePrayer',()=>({usePrayer:()=>({current:null,school:'hanafi'})}))
vi.mock('../services/LocationContext',()=>({useLocationData:()=>({location:null,locating:false,live:false,locate:vi.fn(),error:'Allow location access in your browser and device settings, then try again.'})}))
vi.mock('../data/HadithRepository',()=>({hadithRepository:{getDailyHadith:async()=>null}}))
vi.mock('../data/loader',()=>({loadDailyQuran:async()=>null,loadTranslation:vi.fn()}))
vi.mock('../data/db',()=>({db:{progress:{get:async()=>undefined},quranProgress:{get:async()=>undefined}}}))
afterEach(cleanup)
test('the home GPS button has an actionable permission error instead of failing silently',()=>{
 render(<MemoryRouter><HomePage/></MemoryRouter>)
 expect(screen.getByRole('alert')).toHaveTextContent('Allow location access in your browser and device settings')
 expect(screen.getByRole('button',{name:'Use my location'})).toBeEnabled()
})
