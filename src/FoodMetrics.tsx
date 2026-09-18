import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { correctPlates } from './donationService'
import type { Donation } from './donationService'
import { calculateFreshness, deadlineState } from './foodLogic'
import { asyncError } from './useDonations'
import { Icon, StatusBadge } from './UI'

export function FoodMetrics({ donation, editable = false }: { donation: Donation; editable?: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  const [corrected, setCorrected] = useState(donation.corrected_plates)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const freshness = calculateFreshness(donation.food_type, donation.temperature_c, donation.prepared_at, now)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('plates')).trim()
    setSaving(true); setError(''); setMessage('')
    try {
      const row = await correctPlates(donation.id, value === '' ? null : Number(value))
      setCorrected(row.corrected_plates); setMessage('Plate count saved.')
    } catch (reason) { setError(asyncError(reason)) } finally { setSaving(false) }
  }
  const freshnessStatus = freshness.expired ? 'expired' : freshness.remainingMs <= 3600000 ? 'expiring' : 'fresh'
  const { remainingMs: remaining, urgency } = deadlineState(donation.freshness_expires_at, now)
  return <div className="food-metrics">
    <div className="metrics"><div className={`metric-panel metric-${freshnessStatus}`}>
      <span className="metric-label"><Icon name="clock" />FreshClock <StatusBadge status={freshnessStatus} /></span>
      <strong className="metric-value">{freshness.expired ? 'Window ended' : `${Math.ceil(freshness.remainingMs / 60000)} min`}</strong>
      <progress aria-label="Freshness window remaining" max={freshness.hours * 3600000} value={Math.min(freshness.remainingMs, freshness.hours * 3600000)} />
      <small>Deadline: {new Date(donation.freshness_expires_at).toLocaleString()}</small>
      <small>LiveDeadline: {urgency} · {Math.ceil(remaining / 60000)} min remaining · Rescue: {donation.status}</small>
    </div><div className="metric-panel"><span className="metric-label"><Icon name="plate" />PlateCount</span>
      <strong className="metric-value">{corrected ?? donation.estimated_plates} <span>plates</span></strong><small>Estimate: {donation.estimated_plates}{corrected !== null ? ' · Donor corrected' : ' · Estimated servings'}</small>
    </div></div>
    <p className="metric-help">Estimate assumes 300 g/ml per plate; portions count directly. Quantity is the total across containers.
      {donation.capacity_litres ? ` Capacity per container: ${donation.capacity_litres} litres.` : ''}</p>
    {editable && <form className="plate-correction" onSubmit={submit}>
      <label htmlFor={`plates-${donation.id}`}>Correct plate count (blank restores estimate)</label>
      <div className="correction-controls"><input id={`plates-${donation.id}`} name="plates" type="number" min="0" step="1" defaultValue={corrected ?? ''} disabled={saving} />
      <button className="button-secondary" disabled={saving}>{saving ? 'Saving…' : 'Save plate count'}</button></div>
      {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
    </form>}
    <div className="route-panel"><div className="route-top"><strong><Icon name="route" />RouteBuddy</strong><StatusBadge status={donation.route_state} /></div>
      <p>{donation.route_state === 'holding' ? `Matching window ends ${new Date(donation.release_at!).toLocaleString()}. Refresh after release.`
        : donation.route_batch_id ? 'Grouped with nearby compatible donations.' : 'Ready for an individual rescue.'}</p>
      {donation.route_batch_id && <p className="batch-id">Batch: {donation.route_batch_id}</p>}
      {donation.latitude != null && <p>Pickup coordinates: {donation.latitude}, {donation.longitude}</p>}
    </div>
  </div>
}
