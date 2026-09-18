import { donationClient } from './donationService'
export type Availability = { ngo_id: string; status: 'accepting' | 'closed' | 'full'; updated_at: string }
export type Rescue = { donation_id: string; volunteer_id: string; ngo_id: string; assigned_at: string; picked_up_at: string | null; completed_at: string | null; delivered_plates: number | null }
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
export async function advanceRescue(id: string, action: 'assign' | 'pickup' | 'receive', recipient: string | null = null, plates: number | null = null) {
  const { error } = await donationClient().rpc('advance_rescue', { donation_id: id, action, recipient, plates })
  if (error) throw error
}
