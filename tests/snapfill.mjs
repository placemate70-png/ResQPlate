import assert from 'node:assert/strict'
import { createHandler } from '../supabase/functions/snapfill/handler.ts'
import { parseAnalysis, analysisFields } from '../supabase/functions/snapfill/contract.ts'
const estimate={is_food:true,food_name:'Rice',food_category:'rice',estimated_quantity:null,quantity_unit:null,estimated_servings:null,packaging:'Bowl',visible_freshness_notes:'Visible rice; verify safety separately.',confidence:0.8}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCioAAAAASUVORK5CYII=', 'base64')
const env=key=>({SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-public-key',GEMINI_API_KEY:'test-server-secret'}[key])
function request(photo=new File([png],'qa.png',{type:'image/png'}),auth=true) {
  const body=new FormData(); body.set('image',photo)
  return new Request('https://example.supabase.co/functions/v1/snapfill',{method:'POST',headers:auth?{Authorization:'Bearer test-user',Origin:'https://resqplate-ten.vercel.app'}:{},body})
}
function handler({role='donor',userStatus=200,providerStatus=200,content=estimate,finish='stop',refusal=null,throws=false}={}) {
  let providerCalls=0
  const run=createHandler({env,fetch:async (url,init)=>{
    if (url.includes('/auth/')) return Response.json({id:'test-donor'},{status:userStatus})
    if (url.includes('/rest/')) return Response.json([{role}])
    providerCalls++
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent')
    assert.equal(init.headers['x-goog-api-key'],'test-server-secret')
    const payload=JSON.parse(init.body)
    assert.equal(payload.generationConfig.responseMimeType,'application/json')
    assert.equal(payload.generationConfig.responseJsonSchema.additionalProperties,false)
    assert.equal(payload.contents[0].parts[1].inlineData.mimeType,'image/png')
    assert.equal(payload.contents[0].parts[1].inlineData.data,png.toString('base64'))
    if (throws) throw new Error('private provider failure test-server-secret')
    return Response.json(refusal ? {promptFeedback:{blockReason:'SAFETY'}} : {candidates:[{finishReason:finish==='stop'?'STOP':'MAX_TOKENS',content:{parts:[{text:JSON.stringify(content)}]}}]},{status:providerStatus})
  }})
  return {run,calls:()=>providerCalls}
}
for (const [options,status] of [[{},200],[{role:'volunteer'},403],[{userStatus:401},401],[{providerStatus:429},502],[{providerStatus:500},502],[{throws:true},502],[{content:{...estimate,confidence:2}},502],[{finish:'length'},422],[{refusal:'cannot analyze'},422]]) {
  const test=handler(options),response=await test.run(request())
  assert.equal(response.status,status)
  assert(! (await response.text()).includes('test-server-secret'))
}
const unauth=handler(); assert.equal((await unauth.run(request(undefined,false))).status,401); assert.equal(unauth.calls(),0)
const missingKey=createHandler({env:key=>key==='GEMINI_API_KEY'?undefined:env(key),fetch:async url=>Response.json(url.includes('/auth/')?{id:'test-donor'}:[{role:'donor'}])})
assert.equal((await missingKey(request())).status,503,'Missing Gemini key leaves manual entry available')
const preflight=handler(); assert.equal((await preflight.run(new Request('https://example.supabase.co/functions/v1/snapfill',{method:'OPTIONS',headers:{Origin:'https://resqplate-ten.vercel.app'}}))).status,204); assert.equal(preflight.calls(),0)
assert.equal((await handler().run(new Request('https://example.supabase.co/functions/v1/snapfill',{method:'POST',headers:{Origin:'https://untrusted.example'}}))).status,403)
assert.equal((await handler().run(new Request('https://example.supabase.co/functions/v1/snapfill',{method:'GET'}))).status,405)
for (const photo of [new File(['not image'],'fake.png',{type:'image/png'}),new File(['<svg/>'],'bad.svg',{type:'image/svg+xml'})]) {
  const test=handler(); assert.equal((await test.run(request(photo))).status,415); assert.equal(test.calls(),0)
}
const oversized=handler(); assert.equal((await oversized.run(request(new File([Buffer.alloc(5*1024*1024+1)],'large.png',{type:'image/png'})))).status,413); assert.equal(oversized.calls(),0)
const notFood=handler({content:{...estimate,is_food:false,food_name:null,food_category:null}})
assert.equal((await (await notFood.run(request())).json()).is_food,false)
assert.throws(()=>parseAnalysis({...estimate,estimated_quantity:3,quantity_unit:null}))
assert.equal(analysisFields(estimate).quantity,undefined,'Unknown quantities do not overwrite donor input')
assert.equal(analysisFields({...estimate,estimated_servings:8}).quantity_unit,'portions')
assert.equal(analysisFields({...estimate,estimated_quantity:3,quantity_unit:'kg'}).quantity,'3')
assert.deepEqual(analysisFields({...estimate,is_food:false}),{})
const editable={...analysisFields(estimate),food_name:'Donor corrected rice'}
assert.equal(editable.food_name,'Donor corrected rice')
assert.equal(editable.temperature_c,undefined)
console.log('PASS SnapFill handler tests with controlled provider fixtures: auth/roles, JSON contract, image validation/size, refusals, provider failures, secret redaction and non-food.')
