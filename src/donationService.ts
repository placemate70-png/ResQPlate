import { supabase } from './supabase'

export type Donation = {
  id: string; donor_id: string; food_name: string; food_type: 'gravy' | 'dry' | 'rice';
  description: string; temperature_c: number; quantity: number; quantity_unit: 'kg' | 'litres' | 'portions';
  container: string; container_count: number; prepared_at: string; created_at: string;
  status: 'available' | 'reserved' | 'claimed';
  image_path: string | null;
  reserved_by: string | null; reserved_at: string | null; reservation_expires_at: string | null;
  claimed_at: string | null;
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

export type DonationInput = Omit<Donation, 'id' | 'donor_id' | 'created_at' | 'status' | 'image_path' | 'reserved_by' | 'reserved_at' | 'reservation_expires_at' | 'claimed_at'>

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
    .eq('status', 'available').order('created_at')
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
