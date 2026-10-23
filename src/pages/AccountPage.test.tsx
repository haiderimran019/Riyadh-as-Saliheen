import {afterEach,expect,test,vi} from 'vitest'
import {cleanup,render,screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {AccountPage} from './AccountPage'
vi.mock('../config',()=>({STATIC_READING:false}))
vi.mock('../i18n',()=>({useI18n:()=>({t:(text:string)=>text})}))
vi.mock('../services/LocationContext',()=>({useLocationData:()=>({stop:vi.fn()})}))
vi.mock('../services/AnalyticsContext',()=>({useAnalyticsChoice:()=>({choice:vi.fn()})}))
vi.mock('../services/AccountContext',()=>({useAccount:()=>({account:{user:{id:'test',name:'Reader',email:'reader@example.test',emailVerified:true},googleConnected:false,privacyVersion:'current',location:null,devices:[],consents:[]},capabilities:{requireGoogleSignIn:true,privacyVersion:'current'},loading:false,refresh:vi.fn()})}))
vi.mock('../data/db',()=>({db:{},setSetting:vi.fn()}))
afterEach(cleanup)
test('existing email accounts have a visible Google connection path when reading requires Google',()=>{
 render(<MemoryRouter><AccountPage/></MemoryRouter>)
 expect(screen.getByRole('button',{name:'Continue with Google'})).toBeEnabled()
 expect(screen.getByText('Google sign-in opens the app. Location sharing, analytics and reminders are optional.')).toBeInTheDocument()
})
