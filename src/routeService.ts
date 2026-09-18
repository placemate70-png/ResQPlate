import type { Coordinates } from './locationService'
export type RoadRoute = { distanceMeters:number; durationSeconds:number; coordinates:[number,number][] }
const cache=new Map<string,{expires:number;value:Promise<RoadRoute>}>()
export function validCoordinates(point:Coordinates) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude)<=90 && Math.abs(point.longitude)<=180
}
export async function roadRoute(start:Coordinates,end:Coordinates,request:typeof fetch=fetch):Promise<RoadRoute> {
  if (!validCoordinates(start) || !validCoordinates(end)) throw new Error('Route coordinates unavailable.')
  const key=`${start.longitude},${start.latitude};${end.longitude},${end.latitude}`
  const previous=cache.get(key)
  if (previous && previous.expires>Date.now()) return previous.value
  const value=(async()=>{
    const response=await request(`https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson&steps=false`,{signal:AbortSignal.timeout(12000)})
    if (!response.ok) throw new Error('Route temporarily unavailable')
    const body=await response.json(), route=body.routes?.[0]
    if (body.code!=='Ok' || !route || !Number.isFinite(route.distance) || route.distance<0 || !Number.isFinite(route.duration) || route.duration<0 || route.geometry?.type!=='LineString' || !Array.isArray(route.geometry.coordinates) || route.geometry.coordinates.length<2 || !route.geometry.coordinates.every((p:unknown)=>Array.isArray(p) && p.length===2 && validCoordinates({longitude:p[0],latitude:p[1]}))) throw new Error('Route temporarily unavailable')
    return {distanceMeters:route.distance,durationSeconds:route.duration,coordinates:route.geometry.coordinates}
  })()
  if (cache.size>=20) cache.delete(cache.keys().next().value!)
  cache.set(key,{expires:Date.now()+60000,value})
  try {return await value} catch (error) {cache.delete(key);throw error}
}
