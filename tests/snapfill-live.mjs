import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseAnalysis } from '../supabase/functions/snapfill/contract.ts'
const path=process.argv[2]
if (!path) throw new Error('Pass the absolute path to a real food JPEG, PNG or WebP photo.')
const type={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'}[extname(path).toLowerCase()]
assert(type,'Supported photo required')
const bytes=await readFile(path)
assert(bytes.length>0 && bytes.length<=5*1024*1024)
const client=createClient(process.env.VITE_SUPABASE_URL,process.env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}})
const login=await client.auth.signInWithPassword({email:'resqplate-qa-donor@example.invalid',password:process.env.QA_PASSWORD})
assert.equal(login.error,null)
try {
  const invoke=async body=>client.functions.invoke('snapfill',{body,timeout:55000})
  const bad=new FormData(); bad.set('image',new File(['not image'],'invalid.png',{type:'image/png'}))
  const invalid=await invoke(bad)
  assert(invalid.error,'Invalid image must fail')
  assert.equal(invalid.error.context?.status,415,'Deployed handler must reject spoofed image')
  const body=new FormData(); body.set('image',new File([bytes],'food-photo'+extname(path),{type}))
  const result=await invoke(body)
  if (result.error?.context) console.log('SnapFill response:', result.error.context.status, await result.error.context.json())
  assert.equal(result.error,null)
  const analysis=parseAnalysis(result.data)
  assert.equal(analysis.is_food,true,'Real food photo must be identified')
  assert(analysis.food_name)
  console.log('PASS authenticated deployed SnapFill, real food vision analysis, strict output and spoofed-image rejection')
} finally { await client.auth.signOut({scope:'local'}) }
