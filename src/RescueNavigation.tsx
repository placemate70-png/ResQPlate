import {lazy,Suspense,useEffect,useMemo,useState} from 'react'
import type {Donation} from './donationService'
import type {Availability,Rescue} from './rescueService'
import {roadRoute} from './routeService'
import type {RoadRoute} from './routeService'
import type {MapPoint} from './RescueMap'
const RescueMap=lazy(()=>import('./RescueMap').then(module=>({default:module.RescueMap})))
export function RescueNavigation({donation,rescue,ngo}:{donation:Donation;rescue:Rescue;ngo:Availability|undefined}) {
  const [route,setRoute]=useState<RoadRoute|null>(null),[pending,setPending]=useState(false),[error,setError]=useState('')
  const [now,setNow]=useState(()=>Date.now())
  const ngoLatitude=ngo?.latitude,ngoLongitude=ngo?.longitude
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[])
  const points=useMemo(()=>{
    const markers:MapPoint[]=[]
    if (donation.latitude!=null && donation.longitude!=null) markers.push({latitude:donation.latitude,longitude:donation.longitude,label:'Pickup'})
    if (rescue.latest_volunteer_lat!=null && rescue.latest_volunteer_lng!=null) markers.push({latitude:rescue.latest_volunteer_lat,longitude:rescue.latest_volunteer_lng,label:'Volunteer · last recorded'})
    if (ngoLatitude!=null && ngoLongitude!=null) markers.push({latitude:ngoLatitude,longitude:ngoLongitude,label:'NGO destination'})
    return markers
  },[donation.latitude,donation.longitude,rescue.latest_volunteer_lat,rescue.latest_volunteer_lng,ngoLatitude,ngoLongitude])
  const target=points.find(p=>p.label===(rescue.picked_up_at?'NGO destination':'Pickup'))
  const freshLocation=!!rescue.latest_location_at && now-Date.parse(rescue.latest_location_at)<=300000
  const start=(freshLocation?points.find(p=>p.label==='Volunteer · last recorded'):undefined)??(rescue.picked_up_at?points.find(p=>p.label==='Pickup'):undefined)
  useEffect(()=>{
    let active=true
    void Promise.resolve().then(()=>{
    if (!active) return
    setRoute(null);setError('');setPending(false)
    if (start && target && !rescue.completed_at && !rescue.delivered_at) {
      setPending(true)
      void roadRoute(start,target).then(value=>{if(active)setRoute(value)}).catch(()=>{if(active)setError('Route temporarily unavailable')}).finally(()=>{if(active)setPending(false)})
    }
    })
    return ()=>{active=false}
  },[start,target,freshLocation,rescue.completed_at,rescue.delivered_at])
  return <div className="route-panel"><strong>Route & location</strong>
    {points.length?<Suspense fallback={<p role="status">Loading map…</p>}><RescueMap points={points} route={route} /></Suspense>:<p>Map unavailable: no coordinates have been supplied.</p>}
    {points.map(p=><p key={p.label}>{p.label}: {p.latitude}, {p.longitude}</p>)}
    {rescue.latest_location_at && <p>Last location: {new Date(rescue.latest_location_at).toLocaleString()}</p>}
    {!ngo || ngo.latitude==null || ngo.longitude==null ? <p>NGO destination not configured.</p>:null}
    {pending && <p role="status">Calculating route…</p>}
    {error && <p role="status">{error}. You can continue the rescue.</p>}
    {route && <p role="status">{start?.label==='Pickup'?'Planned driving route from pickup':'Driving route from last recorded volunteer location'} to {target?.label}: {(route.distanceMeters/1000).toFixed(1)} km · ≈ {Math.ceil(route.durationSeconds/60)} min. Estimate excludes live traffic.</p>}
    {(!start || !freshLocation) && !rescue.completed_at && <p>Current volunteer location unavailable. Allow / update location in Active Rescue for route information.</p>}
  </div>
}
