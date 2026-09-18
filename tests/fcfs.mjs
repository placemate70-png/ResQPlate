import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const donationId = process.argv[2]
assert(donationId, 'Pass an available QA donation ID')
assert(process.env.QA_PASSWORD, 'Set QA_PASSWORD for the provisioned QA accounts')
function client() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } })
}
async function login(name) {
  const c = client()
  const auth = await c.auth.signInWithPassword({ email: `resqplate-qa-${name}@example.invalid`, password: process.env.QA_PASSWORD })
  assert.equal(auth.error, null)
  return c
}
const [a, b, donor] = await Promise.all(['volunteer-a', 'volunteer-b', 'donor'].map(login))
try {
  const attempts = await Promise.all([a, b].map(c => c.rpc('reserve_donation', { donation_id: donationId })))
  attempts.forEach(result => assert.equal(result.error, null))
  assert.equal(attempts.filter(result => result.data.success).length, 1)
  const winnerIndex = attempts.findIndex(result => result.data.success)
  const winner = [a, b][winnerIndex], loser = [a, b][1 - winnerIndex]
  const row = await winner.from('donations').select('*').eq('id', donationId).single()
  assert.equal(row.error, null)
  assert.equal(row.data.status, 'reserved')
  assert.equal(Date.parse(row.data.reservation_expires_at) - Date.parse(row.data.reserved_at), 60000)
  const retry = await winner.rpc('reserve_donation', { donation_id: donationId })
  assert.equal(retry.data.donation.reserved_at, row.data.reserved_at, 'Retry must not extend the window')
  const hidden = await loser.from('donations').select('id').eq('id', donationId)
  assert.equal(hidden.data.length, 0)
  const denied = await donor.rpc('reserve_donation', { donation_id: donationId })
  assert.equal(denied.error?.code, '42501')
  const direct = await winner.from('donations').update({ status: 'available' }).eq('id', donationId)
  assert.equal(direct.error?.code, '42501')
  const anonymous = await client().rpc('reserve_donation', { donation_id: donationId })
  assert(anonymous.error)
  console.log('PASS: two live Auth sessions, exactly one FCFS winner, 60-second timestamps, nonrenewing retry, loser isolation, role and direct-update denial.')
} finally {
  await Promise.all([a, b, donor].map(c => c.auth.signOut({ scope: 'local' })))
}
