import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
const id=process.argv[2]; assert(id,'Pass an existing claimed QA fixture ID')
const users=await Promise.all(['donor','volunteer-a','volunteer-b','ngo'].map(async name=>{
 const client=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}})
 const login=await client.auth.signInWithPassword({email:`resqplate-qa-${name}@example.invalid`,password:process.env.QA_PASSWORD});assert.equal(login.error,null)
 return {client,id:login.data.user.id}
}))
try {
 const [donor,a,b,ngo]=users
 const donation=await donor.client.from('donations').select('*').eq('id',id).single();assert.equal(donation.error,null);assert(donation.data.food_name.startsWith('QA '))
 const owner=donation.data.reserved_by===a.id?a:b, other=owner===a?b:a
 assert.equal((await ngo.client.from('ngo_availability').upsert({ngo_id:ngo.id,status:'accepting'})).error,null)
 assert.equal((await owner.client.rpc('advance_rescue',{donation_id:id,action:'assign',recipient:ngo.id})).error,null)
 const record=(user,latitude,longitude)=>user.client.rpc('record_rescue_location',{donation_id:id,latitude,longitude})
 assert((await record(other,52.517037,13.38886)).error)
 assert((await record(donor,52.517037,13.38886)).error)
 assert((await record(owner,91,13)).error)
 assert((await record(owner,null,13)).error)
 // Explicit database test coordinates; this does not simulate browser GPS.
 const saved=await record(owner,52.517037,13.38886);assert.equal(saved.error,null);assert(saved.data.latest_location_at)
 assert.equal(saved.data.latest_volunteer_lat,52.517037)
 assert.equal((await record(owner,52.529407,13.397634)).data.latest_location_at,saved.data.latest_location_at,'Writes throttled')
 for (const participant of [donor,owner,ngo]) {
  const row=await participant.client.from('rescues').select('*').eq('donation_id',id).single();assert.equal(row.error,null);assert.equal(row.data.latest_location_at,saved.data.latest_location_at)
 }
 assert.equal((await other.client.from('rescues').select('*').eq('donation_id',id)).data.length,0)
 assert((await owner.client.from('rescues').update({latest_volunteer_lat:1}).eq('donation_id',id)).error)
 console.log('PASS private location RPC, coordinate validation, participant RLS, timestamp persistence and write throttle. QA rescue:',id)
} finally {await Promise.all(users.map(u=>u.client.auth.signOut({scope:'local'})))}
