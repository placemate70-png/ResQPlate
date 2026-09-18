import { useRescueLocation } from './useRescueLocation'
export function RescueLocation({id,active,activity,onAction}:{id:string;active:boolean;activity:string;onAction?:()=>void}) {
  const state=useRescueLocation(id,active,activity)
  return <div className="route-panel"><strong>Device location</strong>
    <p>Your location is saved in Supabase for this rescue's authorized participants. Routes use OpenStreetMap/OSRM; no continuous tracking.</p>
    <button className="button-secondary" disabled={!active || state.pending} onClick={()=>void state.capture().then(onAction)}>{state.pending?'Getting location…':'Allow / update location'}</button>
    {state.error && <p role="alert">{state.error}</p>}
    {state.location && <p role="status">Location saved for this rescue.</p>}
  </div>
}
