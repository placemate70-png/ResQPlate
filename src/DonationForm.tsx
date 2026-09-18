import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DonationInput } from './donationService'
import { useCreateDonation } from './useDonations'
import { ImageUpload } from './ImageUpload'
import { FoodMetrics } from './FoodMetrics'
import { estimatePlates } from './foodLogic'
import { Icon, LoadingState, PageHeading } from './UI'

export function DonationForm({ userId }: { userId: string }) {
  const state = useCreateDonation()
  const [formError, setFormError] = useState('')
  if (state.restoring) return <LoadingState label="Loading saved donation…" />
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
  return <section><PageHeading title="Create donation" eyebrow="Share something good" description="A few thoughtful details help your food reach the right hands."
    action={<a className="button-link button-secondary" href="/donor">Back to dashboard</a>} />
    {state.error && <p role="alert">{state.error}</p>}
    {formError && <p role="alert">{formError}</p>}
    {state.result ? <><p role="status">Donation saved: {state.result.food_name}. Status: {state.result.status}.</p>
      <div className="form-section"><h3>{state.result.food_name}</h3><FoodMetrics key={state.result.id} donation={state.result} editable /></div>
      <ImageUpload userId={userId} donationId={state.result.id} imagePath={state.result.image_path} /></> :
      <form className="donation-form" onSubmit={submit}><fieldset disabled={state.saving}>
        <div className="form-section"><h3>01 · The food</h3><p>Tell us what you’re sharing.</p><div className="form-grid"><div className="field">
        <label htmlFor="food_name">Food name</label>
        <input id="food_name" name="food_name" required maxLength={120} />
        </div><div className="field">
        <label htmlFor="food_type">Food type</label>
        <select id="food_type" name="food_type" required defaultValue="">
          <option value="" disabled>Select food type</option><option value="gravy">Gravy</option>
          <option value="dry">Dry food</option><option value="rice">Rice</option>
        </select>
        </div><div className="field field-wide">
        <label htmlFor="description">Food details</label>
        <textarea id="description" name="description" maxLength={1000} />
        </div></div></div>
        <div className="form-section"><h3>02 · Freshness</h3><p>Temperature and preparation time inform the existing FreshClock estimate.</p><div className="form-grid"><div className="field">
        <label htmlFor="temperature_c">Temperature (°C)</label>
        <input id="temperature_c" name="temperature_c" type="number" required min={-20} max={100} step="0.1" />
        </div><div className="field"><label htmlFor="prepared_at">Preparation time</label>
        <input id="prepared_at" name="prepared_at" type="datetime-local" required /></div></div></div>
        <div className="form-section"><h3>03 · Quantity & containers</h3><p>Enter the total quantity across all containers. PlateCount estimates servings from this amount.</p><div className="form-grid"><div className="field">
        <label htmlFor="quantity">Quantity</label>
        <input id="quantity" name="quantity" type="number" required min="0.01" step="0.01" />
        </div><div className="field">
        <label htmlFor="quantity_unit">Quantity unit</label>
        <select id="quantity_unit" name="quantity_unit" defaultValue="kg">
          <option value="kg">kg</option><option value="litres">litres</option><option value="portions">portions</option>
        </select>
        </div><div className="field field-wide">
        <label htmlFor="container">Container/vessel details</label>
        <input id="container" name="container" required maxLength={200} />
        </div><div className="field">
        <label htmlFor="container_count">Number of containers</label>
        <input id="container_count" name="container_count" type="number" required min={1} step={1} />
        </div><div className="field">
        <label htmlFor="capacity_litres">Capacity per container (litres, optional)</label>
        <input id="capacity_litres" name="capacity_litres" type="number" min="0.01" step="0.01" />
        </div></div></div>
        <div className="form-section"><h3>04 · Pickup location</h3><p>Use the actual pickup coordinates so RouteBuddy can find nearby donations.</p><div className="form-grid"><div className="field">
        <label htmlFor="latitude">Pickup latitude</label>
        <input id="latitude" name="latitude" type="number" required min="-90" max="90" step="any" />
        </div><div className="field">
        <label htmlFor="longitude">Pickup longitude</label>
        <input id="longitude" name="longitude" type="number" required min="-180" max="180" step="any" />
        </div></div></div>
        <div className="form-footer"><p>After saving, attach your food image. RouteBuddy holds the donation for 180 seconds before release.</p>
        <button type="submit">{state.saving ? 'Saving donation…' : 'Submit donation'}<Icon name="arrow" /></button></div>
      </fieldset></form>}
  </section>
}
