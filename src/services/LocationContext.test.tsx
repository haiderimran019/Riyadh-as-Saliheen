import { afterEach,beforeEach,expect,test,vi } from 'vitest'
import { act,cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { LocationProvider,useLocationData } from './LocationContext'
const fixtures=vi.hoisted(()=>({get:vi.fn(),watch:vi.fn(),clear:vi.fn(),settings:new Map<string,unknown>()}))
vi.mock('../data/db',()=>({getSetting:async(key:string,fallback:unknown)=>fixtures.settings.get(key)??fallback,setSetting:async(key:string,value:unknown)=>{fixtures.settings.set(key,value)}}))
vi.mock('./AccountContext',()=>({useAccount:()=>({account:null,refresh:vi.fn()})}))
function Probe(){const value=useLocationData();return <><button onClick={value.locate}>Locate</button><button onClick={value.stop}>Stop</button><output>{value.location?`${value.location.latitude},${value.location.longitude}:${value.location.timezone}`:'no location'}</output><p role="alert">{value.error}</p></>}
beforeEach(()=>{fixtures.settings.clear();vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:fixtures.get,watchPosition:fixtures.watch,clearWatch:fixtures.clear}});fixtures.get.mockReset();fixtures.watch.mockReset().mockReturnValue(12);fixtures.clear.mockReset()})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const position=(latitude:number,longitude:number,timestamp:number)=>({coords:{latitude,longitude,accuracy:20},timestamp})
test('GPS works without a city, derives timezone from coordinates and ignores older fixes',async()=>{
 render(<LocationProvider><Probe/></LocationProvider>);fireEvent.click(screen.getByText('Locate'))
 expect(fixtures.get.mock.calls[0][2].enableHighAccuracy).toBe(false);expect(fixtures.watch.mock.calls[0][2].enableHighAccuracy).toBe(true)
 const live=fixtures.watch.mock.calls[0][0],quick=fixtures.get.mock.calls[0][0]
 await act(async()=>{live(position(23.8103,90.4125,200));quick(position(24.8607,67.0011,100))})
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('Asia/Dhaka'))
 expect(screen.getByRole('status')).toHaveTextContent('23.8103,90.4125')
 fireEvent.click(screen.getByText('Stop'));expect(fixtures.clear).toHaveBeenCalledWith(12)
 await act(async()=>live(position(24.8607,67.0011,300)))
 expect(screen.getByRole('status')).toHaveTextContent('Asia/Dhaka')
})
test('permission denial stops GPS and explains browser and device recovery',async()=>{
 render(<LocationProvider><Probe/></LocationProvider>);fireEvent.click(screen.getByText('Locate'))
 act(()=>fixtures.watch.mock.calls[0][1]({code:1}))
 expect(screen.getByRole('alert')).toHaveTextContent('Allow location access')
 expect(fixtures.clear).toHaveBeenCalledWith(12)
 expect(screen.getByRole('status')).toHaveTextContent('no location')
})
