import type { FormEvent } from 'react'
import type { Donation } from './donationService'
import { advanceRescue, setAvailability } from './rescueService'
import { useRescues } from './useRescues'
import { unavailableCapabilities } from './integrations'
import { LoadingState } from './UI'

export function RescuePanel({ userId, role, donations }: { userId: string; role: 'ngo' | 'volunteer'; donations: Donation[] }) {
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
  const own = state.rescues.filter(r => role === 'ngo' ? r.ngo_id === userId : r.volunteer_id === userId)
  const completed = own.filter(r => r.completed_at)
  return <div className="form-section"><div className="section-heading"><h3>{role === 'ngo' ? 'ActiveStatus & incoming rescues' : 'Active rescues · LiveTrack'}</h3>
    <button className="button-secondary" disabled={state.pending || state.loading} onClick={() => void state.refresh()}>Refresh rescue status</button></div>
    {state.error && <p role="alert">{state.error}</p>}
    {state.notice && <p role="status">{state.notice}</p>}
    {state.loading ? <LoadingState label="Loading rescue progress…" /> : <>
      {role === 'ngo' && <form onSubmit={event => { event.preventDefault(); const status = String(new FormData(event.currentTarget).get('status')) as 'accepting' | 'closed' | 'full'; void state.act(() => setAvailability(userId, status)) }}>
        <label htmlFor="ngo-status">Your NGO availability</label><select key={state.availability.find(a=>a.ngo_id===userId)?.status ?? 'unset'} id="ngo-status" name="status" required defaultValue={state.availability.find(a=>a.ngo_id===userId)?.status ?? ''}>
          <option value="" disabled>Not configured</option><option value="accepting">Open / accepting</option><option value="closed">Closed</option><option value="full">Full</option>
        </select><button disabled={state.pending}>Save availability</button></form>}
      <p>{unavailableCapabilities.liveTrack}</p>
      {role === 'volunteer' && <><h3>NGO availability</h3>{state.availability.length ? state.availability.map(a=><p key={a.ngo_id}>NGO {a.ngo_id} · {a.status} · Updated {new Date(a.updated_at).toLocaleString()}</p>) : <p>No NGO has configured availability yet.</p>}</>}
      {!own.length && <p>No assigned rescues yet.</p>}
      {role === 'volunteer' && donations.filter(d=>d.status==='claimed' && !state.rescues.some(r=>r.donation_id===d.id)).map(d=><form key={d.id} onSubmit={e=>assign(e,d.id)}>
        <label htmlFor={`recipient-${d.id}`}>Receiving NGO for {d.food_name}</label><select id={`recipient-${d.id}`} name="recipient" required defaultValue=""><option value="" disabled>Select an accepting NGO</option>
          {state.availability.filter(a=>a.status==='accepting').map(a=><option key={a.ngo_id} value={a.ngo_id}>NGO {a.ngo_id}</option>)}</select>
        <button disabled={state.pending || !state.availability.some(a=>a.status==='accepting')}>Assign receiving NGO</button>
        {!state.availability.some(a=>a.status==='accepting') && <p>No NGO is currently accepting. Refresh to check updates.</p>}
      </form>)}
      {own.map(r=><div className="route-panel" key={r.donation_id}><strong>{donations.find(d=>d.id===r.donation_id)?.food_name ?? `Donation ${r.donation_id}`}</strong>
        <p>Assigned: {new Date(r.assigned_at).toLocaleString()} · NGO {r.ngo_id}</p>
        <p>{r.completed_at ? `Received ${new Date(r.completed_at).toLocaleString()} · ${r.delivered_plates} plates` : r.picked_up_at ? `Pickup confirmed ${new Date(r.picked_up_at).toLocaleString()} · Awaiting NGO receipt` : 'Awaiting volunteer pickup confirmation'}</p>
        {role==='volunteer' && !r.picked_up_at && <button disabled={state.pending} onClick={()=>void state.act(()=>advanceRescue(r.donation_id,'pickup'))}>Confirm actual pickup</button>}
        {role==='ngo' && r.picked_up_at && !r.completed_at && <form onSubmit={e=>receive(e,r.donation_id)}><label htmlFor={`received-${r.donation_id}`}>Actual plates received</label>
          <input id={`received-${r.donation_id}`} name="plates" type="number" min="0" step="1" required /><button disabled={state.pending}>Confirm receipt and complete rescue</button></form>}
      </div>)}
      {role==='volunteer' && <p>HeroRank impact metrics: {completed.length} completed deliveries · {completed.reduce((sum,r)=>sum+(r.delivered_plates??0),0)} plates received. No comparative ranking is assigned.</p>}
      <h3>ImpactFeed</h3>{!state.impact.length ? <p>No completed rescues recorded yet.</p> : state.impact.map(item=><p key={item.donation_id}>{item.food_name} · {item.delivered_plates} plates received · {new Date(item.completed_at).toLocaleString()}</p>)}
      <p>{unavailableCapabilities.smartReassign}</p><p>{unavailableCapabilities.safeCall}</p>
    </>}
  </div>
}
