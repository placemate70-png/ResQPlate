import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
const id=process.argv[2];assert(id)
const users=await Promise.all(['donor','volunteer-a','volunteer-b','ngo'].map(async name=>{
 const client=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}})
 const result=await client.auth.signInWithPassword({email:`resqplate-qa-${name}@example.invalid`,password:process.env.QA_PASSWORD});assert.equal(result.error,null)
 await client.realtime.setAuth(result.data.session.access_token)
 return {client,id:result.data.user.id,events:[]}
}))
const channels=[]
async function until(predicate) {
 const timeout=Date.now()+40000
 while(!predicate() && Date.now()<timeout)await new Promise(r=>setTimeout(r,200))
 assert(predicate(),'Realtime event did not arrive')
}
try {
 const [donor,a,b,ngo]=users
 const donation=await donor.client.from('donations').select('*').eq('id',id).single();assert.equal(donation.error,null);assert(donation.data.food_name.startsWith('QA '))
 const owner=donation.data.reserved_by===a.id?a:b,other=owner===a?b:a
 await Promise.all(users.map(async user=>{
  const channel=user.client.channel('qa-sync-'+Date.now()+'-'+user.id,{config:{postgres_changes_options:{wait:true}}});channels.push({channel,client:user.client})
  for(const table of ['rescues','donations','ngo_availability'])channel.on('postgres_changes',{event:'UPDATE',schema:'public',table},payload=>user.events.push({table,row:payload.new}))
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Realtime subscription timeout')),25000)
   channel.subscribe(state=>{if(state==='SUBSCRIBED'){clearTimeout(timer);resolve()}else if(state==='CHANNEL_ERROR'){clearTimeout(timer);reject(new Error('Realtime channel error'))}})
  })
 }))
 const updated=await owner.client.rpc('record_rescue_location',{donation_id:id,latitude:52.517037,longitude:13.38886});assert.equal(updated.error,null)
 console.log('Updated QA rescue location timestamp:',updated.data.latest_location_at)
 await new Promise(resolve=>setTimeout(resolve,2000))
 console.log('Realtime event counts:',users.map(u=>u.events.map(e=>e.table)))
 await until(()=>[donor,owner,ngo].every(u=>u.events.some(e=>e.table==='rescues' && e.row.donation_id===id && e.row.latest_location_at===updated.data.latest_location_at)))
 assert.equal((await donor.client.from('donations').update({corrected_plates:11}).eq('id',id)).error,null)
 await until(()=>[donor,owner,ngo].every(u=>u.events.some(e=>e.table==='donations' && e.row.id===id && e.row.corrected_plates===11)))
 assert.equal((await ngo.client.from('ngo_availability').update({status:'full'}).eq('ngo_id',ngo.id)).error,null)
 await until(()=>users.every(u=>u.events.some(e=>e.table==='ngo_availability' && e.row.ngo_id===ngo.id && e.row.status==='full')))
 assert.equal((await ngo.client.from('ngo_availability').update({status:'accepting'}).eq('ngo_id',ngo.id)).error,null)
 assert(!other.events.some(e=>e.table==='rescues' && e.row.donation_id===id),'Unrelated volunteer must not receive private location payload')
 console.log('PASS actual Realtime donor/volunteer/NGO rescue + donation + availability events; private rescue RLS. Owner QA account:',owner===a?'volunteer-a':'volunteer-b')
} finally {
 await Promise.all(channels.map(({client,channel})=>client.removeChannel(channel)))
 await Promise.all(users.map(u=>u.client.auth.signOut({scope:'local'})))
}
