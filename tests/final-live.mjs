import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
const id=process.argv[2];assert(id,'Pass the completed final QA fixture ID')
const users=await Promise.all(['donor','volunteer-a','volunteer-b','ngo'].map(async name=>{
 const c=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}})
 const r=await c.auth.signInWithPassword({email:`resqplate-qa-${name}@example.invalid`,password:process.env.QA_PASSWORD});assert.equal(r.error,null);return c
}))
try {
 const donation=await users[0].from('donations').select('*').eq('id',id).single();assert(donation.data.food_name.startsWith('QA '))
 const row=await users[0].from('rescues').select('*').eq('donation_id',id).single();assert.equal(row.error,null);assert(row.data.completed_at);assert.equal(row.data.delivered_plates,9)
 for(const c of [users[1],users[3]])assert.equal((await c.from('rescues').select('*').eq('donation_id',id).single()).data.completed_at,row.data.completed_at)
 assert((await users[1].rpc('record_rescue_location',{donation_id:id,latitude:52.517037,longitude:13.38886})).error,'Completed GPS writes denied')
 assert.equal((await users[2].from('rescues').select('*').eq('donation_id',id)).data.length,0)
 const distance=await users[0].rpc('donation_distances',{ids:[id],latitude:52.529407,longitude:13.397634});assert.equal(distance.error,null);assert(distance.data[0].distance_km>0)
 assert.equal((await users[2].rpc('donation_distances',{ids:[id],latitude:52.529407,longitude:13.397634})).data.length,0)
 assert.equal((await users[1].from('ngo_availability').update({latitude:0,longitude:0}).eq('ngo_id',row.data.ngo_id).select()).data.length,0)
 console.log('PASS final receipt persistence, private rescue visibility, completed GPS rejection, distance RPC/RLS and NGO destination ownership')
} finally {await Promise.all(users.map(c=>c.auth.signOut({scope:'local'})))}
