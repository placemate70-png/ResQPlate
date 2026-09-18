import assert from 'node:assert/strict'
import {roadRoute,validCoordinates} from '../src/routeService.ts'
const start={latitude:52.517037,longitude:13.38886},end={latitude:52.529407,longitude:13.397634}
assert(!validCoordinates({latitude:91,longitude:0}));assert(!validCoordinates({latitude:NaN,longitude:0}))
await assert.rejects(()=>roadRoute({latitude:91,longitude:0},end))
if(process.argv.includes('--live')) {
 const route=await roadRoute(start,end);assert(route.distanceMeters>0);assert(route.durationSeconds>0);assert(route.coordinates.length>2)
 console.log('PASS actual OSRM driving route:',route.distanceMeters,'meters;',route.durationSeconds,'seconds')
} else {
 let calls=0
 const provider=async()=>{calls++;return Response.json({code:'Ok',routes:[{distance:1900,duration:320,geometry:{type:'LineString',coordinates:[[13.38886,52.517037],[13.397634,52.529407]]}}]})}
 await Promise.all([roadRoute(start,end,provider),roadRoute(start,end,provider)]);assert.equal(calls,1,'Concurrent route requests deduplicated')
 for(const [index,response] of [Response.json({}, {status:503}),Response.json({code:'NoRoute',routes:[]}),Response.json({code:'Ok',routes:[{distance:-1,duration:2,geometry:{type:'LineString',coordinates:[]}}]})].entries()) {
  await assert.rejects(()=>roadRoute({latitude:51+index,longitude:13},end,async()=>response))
 }
 await assert.rejects(()=>roadRoute({latitude:50,longitude:13},end,async()=>{throw new Error('Network failure')}))
 console.log('PASS routing coordinate validation, response validation, request deduplication and provider/network failures (controlled test responses)')
}
