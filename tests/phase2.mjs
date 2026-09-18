import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { calculateFreshness, estimatePlates } from '../src/foodLogic.ts'
import { waitForRelease } from './waitForRelease.mjs'
function client() { return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false}}) }
async function login(name) {
  const c = client()
  assert.equal((await c.auth.signInWithPassword({ email:`resqplate-qa-${name}@example.invalid`,password:process.env.QA_PASSWORD })).error,null)
  return c
}
const [donor,volunteer,ngo] = await Promise.all(['donor','volunteer-a','ngo'].map(login))
try {
  const base = {food_name:`QA Phase2 ${Date.now()}`,food_type:'rice',temperature_c:29.9,quantity:3,quantity_unit:'kg',container:'QA measured vessel',container_count:2,capacity_litres:2,prepared_at:new Date().toISOString()}
  const locations = [{latitude:17,longitude:78},{latitude:17.005,longitude:78},{latitude:17.02,longitude:78},{latitude:18,longitude:78},{}]
  const rows=[]
  for (const location of locations) {
    const result=await donor.from('donations').insert({...base,...location}).select('*').single()
    assert.equal(result.error,null); rows.push(result.data)
  }
  for (const row of rows) {
    assert.equal(row.estimated_plates,estimatePlates(row.quantity,row.quantity_unit,row.container_count,row.capacity_litres))
    assert.equal(Date.parse(row.freshness_expires_at),calculateFreshness(row.food_type,row.temperature_c,row.prepared_at).expiresAt)
    assert.equal(Date.parse(row.release_at)-Date.parse(row.created_at),180000)
    assert.equal(row.route_state,'holding')
  }
  const early = await volunteer.rpc('reserve_donation',{donation_id:rows[0].id})
  assert.equal(early.error?.code,'23514')
  assert(!(await volunteer.rpc('grabboard_state')).data.available.some(d=>rows.some(r=>r.id===d.id)))
  const corrected=await donor.from('donations').update({corrected_plates:13}).eq('id',rows[0].id).select('*').single()
  assert.equal(corrected.error,null); assert.equal(corrected.data.corrected_plates,13)
  assert.equal((await donor.from('donations').select('*').eq('id',rows[0].id).single()).data.corrected_plates,13)
  assert.equal((await donor.from('donations').update({corrected_plates:-1}).eq('id',rows[0].id)).error?.code,'23514')
  assert.equal((await donor.from('donations').update({route_state:'released'}).eq('id',rows[0].id)).error?.code,'42501')
  assert.equal((await ngo.from('donations').update({corrected_plates:999}).eq('id',rows[0].id).select('*')).data.length,0)
  const distance=await donor.rpc('distance_km',{lat1:17,lon1:78,lat2:17.005,lon2:78})
  assert.equal(distance.error,null); assert(Math.abs(distance.data-0.5559754)<0.00001)
  assert.equal((await donor.rpc('distance_km',{lat1:17,lon1:78,lat2:17,lon2:78})).data,0)
  assert.equal((await donor.rpc('release_route_donations')).error?.code,'42501')
  console.log('PASS stored freshness/plates/correction/RLS/distance/early claim block. Waiting 180 real seconds for database cron…')
  await Promise.all(rows.map(row=>waitForRelease(donor,row.id)))
  const result=await donor.from('donations').select('*').in('id',rows.map(r=>r.id))
  assert.equal(result.error,null)
  const refreshed=rows.map(row=>result.data.find(d=>d.id===row.id))
  assert(refreshed.every(r=>r.route_state==='released'))
  assert(refreshed[0].route_batch_id)
  assert.equal(refreshed[0].route_batch_id,refreshed[1].route_batch_id)
  assert.notEqual(refreshed[0].route_batch_id,refreshed[2].route_batch_id)
  assert.equal(refreshed[3].route_batch_id,null)
  assert.equal(refreshed[4].route_batch_id,null)
  const board=await volunteer.rpc('grabboard_state')
  assert(refreshed.every(row=>board.data.available.some(d=>d.id===row.id)))
  assert.equal((await volunteer.rpc('reserve_donation',{donation_id:rows[0].id})).data.success,true)
  assert.equal((await volunteer.rpc('confirm_reservation',{donation_id:rows[0].id})).data.success,true)
  console.log('PASS real 180-second hold, nearby batching, 1.5km exclusion, individual/missing-location fallback, release and claim.')
} finally { await Promise.all([donor,volunteer,ngo].map(c=>c.auth.signOut({scope:'local'}))) }
