import { useCallback, useEffect, useRef, useState } from 'react'
import { confirmReservation, grabboardState, reserveDonation } from './reservationService'
import type { BoardState } from './reservationService'
import type { Donation } from './donationService'
import { asyncError } from './useDonations'

export function useGrabBoard(userId: string) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Donation[]>([])
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [serverNow, setServerNow] = useState<number | null>(null)
  const sample = useRef<{ server: number; local: number } | null>(null)
  const apply = useCallback((board: BoardState) => {
    setDonations(board.available); setReservations(board.reservations)
    sample.current = { server: Date.parse(board.server_now), local: performance.now() }
    setServerNow(sample.current.server)
  }, [])
  useEffect(() => {
    let active = true
    const load = () => grabboardState().then(board => { if (active) apply(board) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
      .finally(() => { if (active) setLoading(false) })
    void load()
    const polling = window.setInterval(() => { void load() }, 5000)
    const clock = window.setInterval(() => {
      if (sample.current) setServerNow(sample.current.server + performance.now() - sample.current.local)
    }, 1000)
    return () => { active = false; window.clearInterval(polling); window.clearInterval(clock) }
  }, [userId, apply])
  async function refresh() {
    setLoading(true); setError(null)
    try {
      apply(await grabboardState())
    }
    catch (reason) { setError(asyncError(reason)) }
    finally { setLoading(false) }
  }
  async function act(id: string, confirm: boolean) {
    setPending(true); setError(null); setNotice(null)
    try {
      const result = await (confirm ? confirmReservation(id) : reserveDonation(id))
      if (result.success) setNotice(confirm ? 'Claim confirmed.' : 'Reservation saved. Confirm within 60 seconds.')
      else setError(result.message ?? 'Reservation failed.')
      apply(await grabboardState())
    } catch (reason) { setError(asyncError(reason)) }
    finally { setPending(false) }
  }
  return { donations, reservations, loading, error, refresh, serverNow,
    reserve: (id: string) => act(id, false), confirm: (id: string) => act(id, true), pending, notice }
}
