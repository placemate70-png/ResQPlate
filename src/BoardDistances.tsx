import {useEffect,useState} from 'react'
import type {Donation} from './donationService'
import {deviceLocation,donationDistances} from './locationService'
import type {Coordinates} from './locationService'
import {asyncError} from './useDonations'
export function BoardDistances({donations,onDistances}:{donations:Donation[];onDistances:(rows:{donation_id:string;distance_km:number}[])=>void}) {
  const [location,setLocation]=useState<Coordinates|null>(null),[pending,setPending]=useState(false),[error,setError]=useState(''),[distances,setDistances]=useState<{donation_id:string;distance_km:number}[]>([])
  const [calculating,setCalculating]=useState(false)
  const ids=donations.slice(0,100).map(d=>d.id).sort().join(',')
  useEffect(()=>{
    let active=true
    if(location && ids) void Promise.resolve().then(()=>{if(active)setCalculating(true);return donationDistances(ids.split(','),location)}).then(data=>{
      if(!active)return
      setDistances(data);onDistances(data);setError('')
    }).catch(reason=>{if(active)setError(asyncError(reason))}).finally(()=>{if(active)setCalculating(false)})
    return()=>{active=false}
  },[location,ids,onDistances])
  async function locate() {
    setPending(true);setError('');setDistances([]);onDistances([])
    try {setLocation(await deviceLocation())}catch(reason){setError(asyncError(reason))}finally{setPending(false)}
  }
  return <div className="route-panel"><strong>Pickup distances</strong><p>Use your device location to calculate straight-line distances to visible donations. Driving routes are available in Active Rescue.</p>
    <button className="button-secondary" disabled={pending} onClick={()=>void locate()}>{pending?'Getting location…':'Use device location for distances'}</button>
    {error && <p role="status">{error}</p>}
    {calculating && <p role="status">Calculating pickup distances…</p>}
    {location && !ids && <p>No available donations to compare.</p>}
    {location && !!ids && !distances.length && !error && !calculating && <p>No pickup coordinates available.</p>}
    {distances.filter(row=>donations.some(d=>d.id===row.donation_id)).map(row=><p key={row.donation_id}>{donations.find(d=>d.id===row.donation_id)?.food_name}: {row.distance_km.toFixed(2)} km straight-line distance</p>)}
  </div>
}
