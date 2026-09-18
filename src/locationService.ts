import { donationClient } from './donationService'
import type { Rescue } from './rescueService'
export type Coordinates = { latitude: number; longitude: number }

export {deviceLocation} from './browserLocation'

export async function saveRescueLocation(id: string, location: Coordinates) {
  const { data,error } = await donationClient().rpc('record_rescue_location', { donation_id: id, ...location })
  if (error) throw error
  return data as Rescue
}

export async function saveDestination(ngoId: string, location: Coordinates | null) {
  const { error } = await donationClient().from('ngo_availability').update({latitude:location?.latitude ?? null,longitude:location?.longitude ?? null}).eq('ngo_id',ngoId)
  if (error) throw error
}

export async function donationDistances(ids:string[],location:Coordinates) {
  const {data,error}=await donationClient().rpc('donation_distances',{ids,...location})
  if(error)throw error
  return data as {donation_id:string;distance_km:number}[]
}
