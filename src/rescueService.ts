import { donationClient } from './donationService'
export type Availability = { ngo_id: string; status: 'accepting' | 'closed' | 'full'; updated_at: string; latitude: number | null; longitude: number | null }
export type Rescue = { donation_id: string; volunteer_id: string; ngo_id: string; assigned_at: string; pickup_started_at: string | null; picked_up_at: string | null; delivery_started_at: string | null; delivered_at: string | null; completed_at: string | null; delivered_plates: number | null; latest_volunteer_lat: number | null; latest_volunteer_lng: number | null; latest_location_at: string | null }
export type Impact = { donation_id: string; food_name: string; completed_at: string; delivered_plates: number }
export async function rescueState() {
  const client = donationClient()
  const results = await Promise.all([client.from('ngo_availability').select('*'), client.from('rescues').select('*').order('assigned_at', { ascending: false }), client.rpc('impact_feed')])
  for (const result of results) if (result.error) throw result.error
  return { availability: results[0].data as Availability[], rescues: results[1].data as Rescue[], impact: results[2].data as Impact[] }
}
export async function setAvailability(ngoId: string, status: Availability['status']) {
  const { error } = await donationClient().from('ngo_availability').upsert({ ngo_id: ngoId, status })
  if (error) throw error
}
export async function advanceRescue(id: string, action: 'assign' | 'start_pickup' | 'pickup' | 'start_delivery' | 'deliver' | 'receive', recipient: string | null = null, plates: number | null = null) {
  const { error } = await donationClient().rpc('advance_rescue', { donation_id: id, action, recipient, plates })
  if (error) throw error
}
