import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

async function login(name) {
  const c = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } })
  const auth = await c.auth.signInWithPassword({ email: `resqplate-qa-${name}@example.invalid`, password: process.env.QA_PASSWORD })
  assert.equal(auth.error, null)
  return c
}
const [donor, a, b] = await Promise.all(['donor', 'volunteer-a', 'volunteer-b'].map(login))
async function donation(name) {
  const row = await donor.from('donations').insert({ food_name: `QA ${name} ${Date.now()}`, food_type: 'dry',
    temperature_c: 28, quantity: 2, quantity_unit: 'kg', container: 'QA sealed vessel', container_count: 1,
    prepared_at: new Date(Date.now() - 300000).toISOString(), description: 'Development verification record' }).select('*').single()
  assert.equal(row.error, null)
  return row.data.id
}
try {
  const abandoned = await donation('expiry'), confirmed = await donation('confirmed')
  const reserved = await a.rpc('reserve_donation', { donation_id: abandoned })
  assert.equal(reserved.data.success, true)
  const unauthorized = await b.rpc('confirm_reservation', { donation_id: abandoned })
  assert.equal(unauthorized.data.success, false)
  const other = await a.rpc('reserve_donation', { donation_id: confirmed })
  assert.equal(other.data.success, true)
  const confirmation = await a.rpc('confirm_reservation', { donation_id: confirmed })
  assert.equal(confirmation.data.donation.status, 'claimed')
  console.log('Reservation and confirmation PASS. Waiting 62 real seconds with no GrabBoard reads…')
  await new Promise(resolve => setTimeout(resolve, 62000))
  // A plain read does not run the release function: the database cron must have released it.
  const released = await donor.from('donations').select('*').eq('id', abandoned).single()
  assert.equal(released.data.status, 'available')
  assert.equal(released.data.reserved_by, null)
  const late = await a.rpc('confirm_reservation', { donation_id: abandoned })
  assert.equal(late.data.success, false)
  const reclaimed = await b.rpc('reserve_donation', { donation_id: abandoned })
  assert.equal(reclaimed.data.success, true)
  const staleOwner = await a.rpc('confirm_reservation', { donation_id: abandoned })
  assert.equal(staleOwner.data.success, false)
  const retained = await donor.from('donations').select('*').eq('id', confirmed).single()
  assert.equal(retained.data.status, 'claimed')
  assert(retained.data.claimed_at)
  const finalize = await b.rpc('confirm_reservation', { donation_id: abandoned })
  assert.equal(finalize.data.success, true)
  console.log('PASS: server-only 60-second expiry/release, late confirmation denied, other volunteer reclaimed, stale owner denied, confirmed claim retained.')
} finally { await Promise.all([donor, a, b].map(c => c.auth.signOut({ scope: 'local' }))) }
