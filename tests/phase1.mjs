import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

function client() {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } })
}
async function login(name, role) {
  const c = client()
  const auth = await c.auth.signInWithPassword({ email: `resqplate-qa-${name}@example.invalid`, password: process.env.QA_PASSWORD })
  assert.equal(auth.error, null)
  const profile = await c.from('profiles').select('*').single()
  assert.equal(profile.data.id, auth.data.user.id)
  assert.equal(profile.data.role, role)
  return { c, id: auth.data.user.id }
}
const [donor, a, b, ngo] = await Promise.all([
  login('donor', 'donor'), login('volunteer-a', 'volunteer'), login('volunteer-b', 'volunteer'), login('ngo', 'ngo'),
])
try {
  const input = { food_name: `QA Phase 1 complete ${Date.now()}`, food_type: 'rice', temperature_c: 27,
    quantity: 3, quantity_unit: 'kg', container: 'QA sealed containers', container_count: 2,
    prepared_at: new Date(Date.now() - 300000).toISOString(), description: 'Explicit development end-to-end record' }
  for (const denied of [a, ngo]) {
    const result = await denied.c.from('donations').insert(input)
    assert.equal(result.error?.code, '42501', 'Only donors may create donations')
  }
  const invalid = await donor.c.from('donations').insert({ ...input, quantity: 0 })
  assert.equal(invalid.error?.code, '23514')
  const future = await donor.c.from('donations').insert({ ...input, prepared_at: new Date(Date.now() + 3600000).toISOString() })
  assert.equal(future.error?.code, '23514')
  const forged = await donor.c.from('donations').insert({ ...input, status: 'claimed' })
  assert.equal(forged.error?.code, '42501')
  const created = await donor.c.from('donations').insert(input).select('*').single()
  assert.equal(created.error, null)
  const id = created.data.id
  const path = `${donor.id}/${id}/${crypto.randomUUID()}.png`
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCioAAAAASUVORK5CYII=', 'base64')
  const badType = await donor.c.storage.from('food-images').upload(`${donor.id}/${id}/bad.svg`, Buffer.from('<svg/>'), { contentType: 'image/svg+xml' })
  assert(badType.error, 'Bucket must reject SVG')
  const tooLarge = await donor.c.storage.from('food-images').upload(`${donor.id}/${id}/oversized.png`, Buffer.alloc(5 * 1024 * 1024 + 1), { contentType: 'image/png' })
  assert(tooLarge.error, 'Bucket must reject images larger than 5 MB')
  const unauthorized = await a.c.storage.from('food-images').upload(path, png, { contentType: 'image/png' })
  assert(unauthorized.error, 'Volunteer must not upload donor image')
  const upload = await donor.c.storage.from('food-images').upload(path, png, { contentType: 'image/png' })
  assert.equal(upload.error, null)
  const attached = await donor.c.from('donations').update({ image_path: path }).eq('id', id).select('*').single()
  assert.equal(attached.error, null)
  const persisted = await donor.c.from('donations').select('*').eq('id', id).single()
  assert.equal(persisted.data.image_path, path)
  const board = await a.c.rpc('grabboard_state')
  assert(board.data.available.some(row => row.id === id))
  const race = await Promise.all([a, b].map(user => user.c.rpc('reserve_donation', { donation_id: id })))
  race.forEach(result => assert.equal(result.error, null))
  assert.equal(race.filter(result => result.data.success).length, 1)
  const index = race.findIndex(result => result.data.success)
  const winner = [a, b][index], loser = [a, b][1 - index]
  const stolen = await loser.c.rpc('confirm_reservation', { donation_id: id })
  assert.equal(stolen.data.success, false)
  const wrongRole = await ngo.c.rpc('confirm_reservation', { donation_id: id })
  assert.equal(wrongRole.error?.code, '42501')
  const confirmed = await winner.c.rpc('confirm_reservation', { donation_id: id })
  assert.equal(confirmed.data.donation.status, 'claimed')
  const donorView = await donor.c.from('donations').select('*').eq('id', id).single()
  const ngoView = await ngo.c.from('donations').select('*').eq('id', id).single()
  assert.equal(donorView.data.status, 'claimed')
  assert.equal(ngoView.data.status, 'claimed')
  const ngoWrite = await ngo.c.from('donations').update({ image_path: null }).eq('id', id).select('id')
  assert.equal(ngoWrite.data.length, 0)
  const signed = await ngo.c.storage.from('food-images').createSignedUrl(path, 60)
  assert.equal(signed.error, null)
  const image = await fetch(signed.data.signedUrl)
  assert.equal(image.status, 200)
  assert.equal((await image.arrayBuffer()).byteLength, png.byteLength)
  const anonymousImage = await client().storage.from('food-images').createSignedUrl(path, 60)
  assert(anonymousImage.error)
  const anonymousRead = await client().from('donations').select('id')
  assert(anonymousRead.error)
  const direct = await winner.c.from('donations').update({ reserved_by: loser.id }).eq('id', id)
  assert.equal(direct.error?.code, '42501')
  console.log(`PASS Phase 1 live API flow: donation ${id}; create/upload/persistence/GrabBoard/concurrent reservation/confirmation/NGO/private image/RLS/validation.`)
} finally {
  for (const user of [donor, a, b, ngo]) {
    assert.equal((await user.c.auth.signOut({ scope: 'local' })).error, null)
    assert.equal((await user.c.auth.getSession()).data.session, null)
  }
  console.log('PASS real Auth logins, roles, logout and session removal.')
}
