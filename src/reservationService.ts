import { donationClient } from './donationService'
import type { Donation } from './donationService'

export type ReservationResult = { success: boolean; message?: string; donation?: Donation; server_now?: string }
export async function reserveDonation(id: string): Promise<ReservationResult> {
  const { data, error } = await donationClient().rpc('reserve_donation', { donation_id: id })
  if (error) throw error
  return data
}

export async function confirmReservation(id: string): Promise<ReservationResult> {
  const { data, error } = await donationClient().rpc('confirm_reservation', { donation_id: id })
  if (error) throw error
  return data
}

export type BoardState = { available: Donation[]; reservations: Donation[]; server_now: string }
export async function grabboardState(): Promise<BoardState> {
  const { data, error } = await donationClient().rpc('grabboard_state')
  if (error) throw error
  return data
}
