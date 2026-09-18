import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DonationInput } from './donationService'
import { useCreateDonation } from './useDonations'
import { ImageUpload } from './ImageUpload'
import { FoodMetrics } from './FoodMetrics'
import { estimatePlates } from './foodLogic'

export function DonationForm({ userId }: { userId: string }) {
  const state = useCreateDonation()
  const [formError, setFormError] = useState('')
  if (state.restoring) return <p role="status">Loading saved donation…</p>
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (key: string) => String(data.get(key)).trim()
    const capacity = text('capacity_litres') ? Number(data.get('capacity_litres')) : null
    try { estimatePlates(Number(data.get('quantity')), text('quantity_unit') as DonationInput['quantity_unit'], Number(data.get('container_count')), capacity) }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : 'Invalid quantity'); return }
    setFormError('')
    await state.submit({
      food_name: text('food_name'), food_type: text('food_type') as DonationInput['food_type'],
      description: text('description'), temperature_c: Number(data.get('temperature_c')),
      quantity: Number(data.get('quantity')), quantity_unit: text('quantity_unit') as DonationInput['quantity_unit'],
      container: text('container'), container_count: Number(data.get('container_count')),
      prepared_at: new Date(text('prepared_at')).toISOString(),
      capacity_litres: capacity, latitude: Number(data.get('latitude')), longitude: Number(data.get('longitude')),
    })
  }
  return <section><h2>Create donation</h2><a href="/donor">Donor dashboard</a>
    {state.error && <p role="alert">{state.error}</p>}
    {formError && <p role="alert">{formError}</p>}
    {state.result ? <><p role="status">Donation saved: {state.result.food_name}. Status: {state.result.status}.</p>
      <FoodMetrics key={state.result.id} donation={state.result} editable />
      <ImageUpload userId={userId} donationId={state.result.id} imagePath={state.result.image_path} /></> :
      <form onSubmit={submit}><fieldset disabled={state.saving}>
        <label htmlFor="food_name">Food name</label>
        <input id="food_name" name="food_name" required maxLength={120} />
        <label htmlFor="food_type">Food type</label>
        <select id="food_type" name="food_type" required defaultValue="">
          <option value="" disabled>Select food type</option><option value="gravy">Gravy</option>
          <option value="dry">Dry food</option><option value="rice">Rice</option>
        </select>
        <label htmlFor="description">Food details</label>
        <textarea id="description" name="description" maxLength={1000} />
        <label htmlFor="temperature_c">Temperature (°C)</label>
        <input id="temperature_c" name="temperature_c" type="number" required min={-20} max={100} step="0.1" />
        <label htmlFor="quantity">Quantity</label>
        <input id="quantity" name="quantity" type="number" required min="0.01" step="0.01" />
        <label htmlFor="quantity_unit">Quantity unit</label>
        <select id="quantity_unit" name="quantity_unit" defaultValue="kg">
          <option value="kg">kg</option><option value="litres">litres</option><option value="portions">portions</option>
        </select>
        <label htmlFor="container">Container/vessel details</label>
        <input id="container" name="container" required maxLength={200} />
        <label htmlFor="container_count">Number of containers</label>
        <input id="container_count" name="container_count" type="number" required min={1} step={1} />
        <label htmlFor="capacity_litres">Capacity per container (litres, optional)</label>
        <input id="capacity_litres" name="capacity_litres" type="number" min="0.01" step="0.01" />
        <label htmlFor="latitude">Pickup latitude</label>
        <input id="latitude" name="latitude" type="number" required min="-90" max="90" step="any" />
        <label htmlFor="longitude">Pickup longitude</label>
        <input id="longitude" name="longitude" type="number" required min="-180" max="180" step="any" />
        <p>Enter the actual pickup coordinates. RouteBuddy holds the donation for 180 seconds before release.</p>
        <label htmlFor="prepared_at">Preparation time</label>
        <input id="prepared_at" name="prepared_at" type="datetime-local" required />
        <button type="submit">{state.saving ? 'Saving donation…' : 'Submit donation'}</button>
      </fieldset></form>}
  </section>
}
