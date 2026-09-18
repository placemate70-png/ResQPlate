import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { correctPlates } from './donationService'
import type { Donation } from './donationService'
import { calculateFreshness } from './foodLogic'
import { asyncError } from './useDonations'

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
  return <div>
    <p>FreshClock: {freshness.expired ? 'Freshness window ended' : `${Math.ceil(freshness.remainingMs / 60000)} minutes remaining`}.
      {' '}Deadline: {new Date(donation.freshness_expires_at).toLocaleString()}</p>
    <p>PlateCount: {corrected ?? donation.estimated_plates} plates. Estimate: {donation.estimated_plates}.</p>
    <p>Estimate assumes 300 g/ml per plate; portions count directly. Quantity is the total across containers.</p>
    {donation.capacity_litres && <p>Capacity per container: {donation.capacity_litres} litres.</p>}
    {editable && <form onSubmit={submit}>
      <label htmlFor={`plates-${donation.id}`}>Correct plate count (blank restores estimate)</label>
      <input id={`plates-${donation.id}`} name="plates" type="number" min="0" step="1" defaultValue={corrected ?? ''} disabled={saving} />
      <button disabled={saving}>{saving ? 'Saving…' : 'Save plate count'}</button>
      {message && <p role="status">{message}</p>}{error && <p role="alert">{error}</p>}
    </form>}
    <p>RouteBuddy: {donation.route_state === 'holding' ? `Holding until ${new Date(donation.release_at!).toLocaleString()} (refresh after release)`
      : donation.route_batch_id ? `Nearby batch ${donation.route_batch_id}` : 'Released individually'}.</p>
    {donation.latitude != null && <p>Pickup coordinates: {donation.latitude}, {donation.longitude}</p>}
  </div>
}
