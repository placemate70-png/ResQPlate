import assert from 'node:assert/strict'
import {deviceLocation} from '../src/browserLocation.ts'
const original=Object.getOwnPropertyDescriptor(globalThis,'navigator')
try {
 const set=geolocation=>Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation}})
 set(undefined);await assert.rejects(()=>deviceLocation(),/not supported/)
 for(const code of [1,2,3]) {
  set({getCurrentPosition:(_,error)=>error({code})})
  await assert.rejects(()=>deviceLocation(),code===1?/permission is required/:/unavailable/)
 }
 set({getCurrentPosition:(resolve,_,options)=>{assert.equal(options.timeout,12000);assert.equal(options.maximumAge,30000);resolve({coords:{latitude:12,longitude:77}})}})
 assert.deepEqual(await deviceLocation(),{latitude:12,longitude:77})
 console.log('PASS controlled GPS contract: unsupported, denied, unavailable, timeout and coordinate passthrough. These fixtures do not verify actual device positioning.')
} finally {if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator}
