import { createContext,useCallback,useContext,useEffect,useState,type ReactNode } from 'react'
import { STATIC_READING } from '../config'
import { useBootData } from '../ssr/BootData'
import { api,type AccountData,type Capabilities } from './api'
type AccountContextValue={account:AccountData|null;capabilities:Capabilities|null;loading:boolean;connectionError:string;refresh:()=>Promise<void>}
const AccountContext=createContext<AccountContextValue|null>(null)
export function AccountProvider({children}:{children:ReactNode}) {
  const boot=useBootData()
  const [account,setAccount]=useState<AccountData|null>(null),[capabilities,setCapabilities]=useState<Capabilities|null>(boot.capabilities || null),[loading,setLoading]=useState(!STATIC_READING),[connectionError,setConnectionError]=useState('')
  const refresh=useCallback(async()=>{
    if(STATIC_READING){setLoading(false);return}
    try { const session=await api<{user:unknown}|null>('/auth/get-session');if(session?.user)setAccount(await api<AccountData>('/account'));else setAccount(null);setConnectionError('') }catch{setConnectionError('The account server is not available. Please try signing in again shortly.');setAccount(null)}finally{setLoading(false)}
  },[])
  useEffect(()=>{if(STATIC_READING)return;void api<Capabilities>('/health').then(setCapabilities).catch(()=>setConnectionError('The account server is not available.'));void refresh()},[refresh])
  return <AccountContext.Provider value={{account,capabilities,loading,connectionError,refresh}}>{children}</AccountContext.Provider>
}
export function useAccount(){const value=useContext(AccountContext);if(!value)throw new Error('Account provider is missing.');return value}
