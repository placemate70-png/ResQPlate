import type { FormEvent } from 'react'
import type { Donation } from './donationService'
import { advanceRescue, setAvailability } from './rescueService'
import { useRescues } from './useRescues'
import { LoadingState } from './UI'
import { nextRescueAction, rescueStage } from './rescueLogic'
import { RescueLocation } from './RescueLocation'
import { RescueNavigation } from './RescueNavigation'
import { saveDestination } from './locationService'
import { DonationDetails } from './DonationDetails'
import { RescueTimeline } from './RescueTimeline'
import { ImpactStats } from './ImpactStats'

export function RescuePanel({ userId, role, donations, focusId }: { userId: string; role: 'ngo' | 'volunteer'; donations: Donation[]; focusId?:string }) {
  const state = useRescues()
  function assign(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const recipient = String(new FormData(event.currentTarget).get('recipient'))
    void state.act(() => advanceRescue(id, 'assign', recipient))
  }
  function receive(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const plates = Number(new FormData(event.currentTarget).get('plates'))
    void state.act(() => advanceRescue(id, 'receive', null, plates))
  }
  const own = state.rescues.filter(r => (role === 'ngo' ? r.ngo_id === userId : r.volunteer_id === userId) && (!focusId || r.donation_id===focusId))
  return <div className="form-section"><div className="section-heading"><h3>{role === 'ngo' ? 'Incoming & completed rescues' : 'Your rescues'}</h3>
    <button className="button-secondary" disabled={state.pending || state.loading} onClick={() => void state.refresh()}>Refresh rescue status</button></div>
    {state.error && <p role="alert">{state.error}</p>}
    {state.notice && <p role="status">{state.notice}</p>}
    <p role="status">{state.live?'Live updates connected.':'Connecting live updates; database refresh remains available.'}</p>
    {state.loading ? <LoadingState label="Loading rescue progress…" /> : <>
      {role === 'ngo' && <form onSubmit={event => { event.preventDefault(); const status = String(new FormData(event.currentTarget).get('status')) as 'accepting' | 'closed' | 'full'; void state.act(() => setAvailability(userId, status)) }}>
        <label htmlFor="ngo-status">Your NGO availability</label><select key={state.availability.find(a=>a.ngo_id===userId)?.status ?? 'unset'} id="ngo-status" name="status" required defaultValue={state.availability.find(a=>a.ngo_id===userId)?.status ?? ''}>
          <option value="" disabled>Not configured</option><option value="accepting">Open / accepting</option><option value="closed">Closed</option><option value="full">Full</option>
        </select><button disabled={state.pending}>Save availability</button></form>}
      {role==='ngo' && state.availability.some(a=>a.ngo_id===userId) && <form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const lat=String(data.get('latitude')).trim(),lng=String(data.get('longitude')).trim();void state.act(()=>saveDestination(userId,lat==='' && lng===''?null:{latitude:lat===''?NaN:Number(lat),longitude:lng===''?NaN:Number(lng)}))}}>
        <h3>NGO destination</h3><p>Enter the actual receiving coordinates. Leave both blank to clear.</p>
        <label htmlFor="ngo-lat">Destination latitude</label><input key={`lat-${state.availability.find(a=>a.ngo_id===userId)?.latitude}`} id="ngo-lat" name="latitude" type="number" min="-90" max="90" step="any" defaultValue={state.availability.find(a=>a.ngo_id===userId)?.latitude??''}/>
        <label htmlFor="ngo-lng">Destination longitude</label><input key={`lng-${state.availability.find(a=>a.ngo_id===userId)?.longitude}`} id="ngo-lng" name="longitude" type="number" min="-180" max="180" step="any" defaultValue={state.availability.find(a=>a.ngo_id===userId)?.longitude??''}/><button disabled={state.pending}>Save destination</button>
      </form>}
      {role === 'volunteer' && <><h3>NGO availability</h3>{state.availability.length ? state.availability.map(a=><p key={a.ngo_id}>NGO {a.ngo_id} · {a.status} · Updated {new Date(a.updated_at).toLocaleString()}</p>) : <p>No NGO has configured availability yet.</p>}</>}
      {!own.length && <p>No assigned rescues yet.</p>}
      {role === 'volunteer' && donations.filter(d=>d.status==='claimed' && (!focusId || d.id===focusId) && !state.rescues.some(r=>r.donation_id===d.id)).map(d=><form key={d.id} onSubmit={e=>assign(e,d.id)}>
        <label htmlFor={`recipient-${d.id}`}>Receiving NGO for {d.food_name}</label><select id={`recipient-${d.id}`} name="recipient" required defaultValue=""><option value="" disabled>Select an accepting NGO</option>
          {state.availability.filter(a=>a.status==='accepting').map(a=><option key={a.ngo_id} value={a.ngo_id}>NGO {a.ngo_id}</option>)}</select>
        <button disabled={state.pending || !state.availability.some(a=>a.status==='accepting')}>Assign receiving NGO</button>
        {!state.availability.some(a=>a.status==='accepting') && <p>No NGO is currently accepting. Refresh to check updates.</p>}
      </form>)}
      {own.map(r=><div className="route-panel" key={r.donation_id}><strong>{donations.find(d=>d.id===r.donation_id)?.food_name ?? `Donation ${r.donation_id}`}</strong>
        <p>Assigned: {new Date(r.assigned_at).toLocaleString()} · NGO {r.ngo_id.slice(0,8)} · Volunteer {r.volunteer_id.slice(0,8)}</p>
        <p>{rescueStage(r)}{r.completed_at ? ` · Received ${new Date(r.completed_at).toLocaleString()} · ${r.delivered_plates} plates` : r.delivered_at ? ' · Waiting for NGO confirmation' : ''}</p>
        {role==='volunteer' && new URLSearchParams(window.location.search).get('rescue')!==r.donation_id && <a className="button-link button-secondary" href={`/volunteer/rescue?rescue=${r.donation_id}`}>View Rescue</a>}
        {(role==='ngo' || focusId===r.donation_id) && donations.find(d=>d.id===r.donation_id) && <><DonationDetails donation={donations.find(d=>d.id===r.donation_id)!}/><RescueTimeline donation={donations.find(d=>d.id===r.donation_id)!} rescue={r}/></>}
        {role==='volunteer' && new URLSearchParams(window.location.search).get('rescue')===r.donation_id && <RescueLocation id={r.donation_id} active={!r.completed_at} activity={r.delivered_at??r.delivery_started_at??r.picked_up_at??r.pickup_started_at??r.assigned_at} onAction={()=>void state.refresh()} />}
        {((role==='ngo' && !r.completed_at) || new URLSearchParams(window.location.search).get('rescue')===r.donation_id) && donations.find(d=>d.id===r.donation_id) && <RescueNavigation donation={donations.find(d=>d.id===r.donation_id)!} rescue={r} ngo={state.availability.find(a=>a.ngo_id===r.ngo_id)} />}
        {role==='volunteer' && focusId===r.donation_id && nextRescueAction(r) && <button disabled={state.pending} onClick={()=>void state.act(()=>advanceRescue(r.donation_id,nextRescueAction(r)!.action))}>{state.pending?'Updating rescue…':nextRescueAction(r)!.label}</button>}
        {role==='ngo' && r.delivered_at && !r.completed_at && <form onSubmit={e=>receive(e,r.donation_id)}><label htmlFor={`received-${r.donation_id}`}>Actual plates received</label>
          <input id={`received-${r.donation_id}`} name="plates" type="number" min="0" step="1" required /><button disabled={state.pending}>Confirm receipt and complete rescue</button></form>}
      </div>)}
      {role==='ngo' && <ImpactStats donations={donations} rescues={own} role="ngo" loading={state.loading} error={state.error}/>}
      <h3>Community impact</h3>{!state.impact.length ? <p>No completed rescues recorded yet.</p> : state.impact.map(item=><p key={item.donation_id}>{item.food_name} · {item.delivered_plates} plates received · {new Date(item.completed_at).toLocaleString()}</p>)}
    </>}
  </div>
}
