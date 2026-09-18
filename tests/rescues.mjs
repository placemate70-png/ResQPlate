import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { waitForRelease } from './waitForRelease.mjs'
async function login(name) {
  const c = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email: `resqplate-qa-${name}@example.invalid`, password: process.env.QA_PASSWORD })
  assert.equal(error, null)
  return { c, id: data.user.id }
}
const [donor,a,b,ngo] = await Promise.all(['donor','volunteer-a','volunteer-b','ngo'].map(login))
try {
  let result = await a.c.from('ngo_availability').upsert({ngo_id:a.id,status:'accepting'})
  assert(result.error, 'Volunteer cannot publish NGO availability')
  for (const status of ['closed','full','accepting']) {
    result = await ngo.c.from('ngo_availability').upsert({ngo_id:ngo.id,status})
    assert.equal(result.error,null)
    result = await a.c.from('ngo_availability').select('*').eq('ngo_id',ngo.id).single()
    assert.equal(result.data.status,status)
  }
  result = await donor.c.from('donations').insert({food_name:`QA rescue completion ${Date.now()}`,food_type:'rice',temperature_c:28,quantity:3,quantity_unit:'kg',container:'QA sealed vessel',container_count:1,prepared_at:new Date().toISOString()}).select('*').single()
  assert.equal(result.error,null)
  const id=result.data.id
  console.log('Waiting for real 180-second release for rescue verification…')
  await waitForRelease(donor.c,id)
  assert.equal((await a.c.rpc('reserve_donation',{donation_id:id})).data.success,true)
  assert.equal((await a.c.rpc('confirm_reservation',{donation_id:id})).data.success,true)
  const step = (user,action,extras={})=>user.c.rpc('advance_rescue',{donation_id:id,action,...extras})
  assert((await step(b,'assign',{recipient:ngo.id})).error)
  assert((await donor.c.from('rescues').insert({donation_id:id,volunteer_id:a.id,ngo_id:ngo.id})).error)
  assert.equal((await ngo.c.from('ngo_availability').upsert({ngo_id:ngo.id,status:'closed'})).error,null)
  assert((await step(a,'assign',{recipient:ngo.id})).error,'Closed NGO cannot be assigned')
  assert.equal((await ngo.c.from('ngo_availability').upsert({ngo_id:ngo.id,status:'accepting'})).error,null)
  assert.equal((await step(a,'assign',{recipient:ngo.id})).error,null)
  assert(!(await donor.c.rpc('impact_feed')).data.some(row=>row.donation_id===id),'Claims are not completed impact')
  assert((await step(ngo,'receive',{plates:8})).error, 'Receipt before pickup denied')
  assert((await step(b,'pickup')).error)
  assert.equal((await step(a,'pickup')).error,null)
  assert((await step(ngo,'receive',{plates:-1})).error)
  assert((await step(a,'receive',{plates:8})).error)
  assert.equal((await step(ngo,'receive',{plates:8})).error,null)
  const persisted=await ngo.c.from('rescues').select('*').eq('donation_id',id).single()
  assert.equal(persisted.data.delivered_plates,8)
  assert(persisted.data.completed_at)
  assert.equal((await b.c.from('rescues').select('*').eq('donation_id',id)).data.length,0)
  assert.equal((await step(ngo,'receive',{plates:100})).data.delivered_plates,8,'Completion is idempotent')
  const feed=await donor.c.rpc('impact_feed')
  assert.equal(feed.error,null)
  assert.equal(feed.data.find(row=>row.donation_id===id).delivered_plates,8)
  const anon=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  assert((await anon.rpc('impact_feed')).error)
  console.log('PASS real availability, assigned pickup/NGO receipt, idempotence, RLS, completion persistence and impact feed')
} finally { await Promise.all([donor,a,b,ngo].map(user=>user.c.auth.signOut({scope:'local'}))) }
