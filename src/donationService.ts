import { supabase } from './supabase'

export type Donation = {
  id: string; donor_id: string; food_name: string; food_type: 'gravy' | 'dry' | 'rice';
  description: string; temperature_c: number; quantity: number; quantity_unit: 'kg' | 'litres' | 'portions';
  container: string; container_count: number; prepared_at: string; created_at: string;
  status: 'available' | 'reserved' | 'claimed';
  image_path: string | null;
  reserved_by: string | null; reserved_at: string | null; reservation_expires_at: string | null;
  claimed_at: string | null;
  freshness_expires_at: string; estimated_plates: number; corrected_plates: number | null;
  capacity_litres: number | null; latitude: number | null; longitude: number | null;
  route_state: 'holding' | 'released'; release_at: string | null; route_batch_id: string | null;
}

export function donationClient() {
  if (!supabase) throw new Error('Supabase connection is not configured.')
  return supabase
}

export async function ownDonations(donorId: string): Promise<Donation[]> {
  const { data, error } = await donationClient().from('donations').select('*')
    .eq('donor_id', donorId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export type DonationInput = Pick<Donation, 'food_name' | 'food_type' | 'description' | 'temperature_c' | 'quantity' | 'quantity_unit' | 'container' | 'container_count' | 'prepared_at'> & Partial<Pick<Donation, 'capacity_litres' | 'latitude' | 'longitude' | 'corrected_plates'>>

export async function correctPlates(id: string, corrected: number | null): Promise<Donation> {
  const { data, error } = await donationClient().from('donations').update({ corrected_plates: corrected }).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function createDonation(input: DonationInput): Promise<Donation> {
  const { data, error } = await donationClient().from('donations').insert(input).select('*').single()
  if (error) throw error
  return data
}

export async function getDonation(id: string): Promise<Donation> {
  const { data, error } = await donationClient().from('donations').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function availableDonations(): Promise<Donation[]> {
  const { data, error } = await donationClient().from('donations').select('*')
    .eq('status', 'available').eq('route_state', 'released').order('created_at')
  if (error) throw error
  return data
}

export async function ownReservations(userId: string): Promise<Donation[]> {
  const { data, error } = await donationClient().from('donations').select('*')
    .eq('reserved_by', userId).in('status', ['reserved', 'claimed']).order('reserved_at', { ascending: false })
  if (error) throw error
  return data
}

export async function ngoDonations(): Promise<Donation[]> {
  const { data, error } = await donationClient().from('donations').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
