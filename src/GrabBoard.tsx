import { DonationDetails } from './DonationDetails'
import { useGrabBoard } from './useGrabBoard'

export function GrabBoard({ userId }: { userId: string }) {
  const state = useGrabBoard(userId)
  return <section><h2>GrabBoard</h2><a href="/volunteer">Volunteer dashboard</a>
    <p><button disabled={state.loading} onClick={() => void state.refresh()}>Refresh donations</button></p>
    {state.error && <p role="alert">{state.error}</p>}
    {state.notice && <p role="status">{state.notice}</p>}
    <h3>Your reservations</h3>
    {!state.reservations.length && !state.loading && <p>No reservations.</p>}
    {state.reservations.map(row => {
      const seconds = state.serverNow === null || !row.reservation_expires_at ? 0
        : Math.max(0, Math.ceil((Date.parse(row.reservation_expires_at) - state.serverNow) / 1000))
      return <div key={row.id}><DonationDetails donation={row} />
        {row.status === 'reserved' ? <>
          <p>Reservation ends: {row.reservation_expires_at && new Date(row.reservation_expires_at).toLocaleString()}</p>
          <p>Remaining: {seconds} seconds</p>
          <button disabled={state.pending || !seconds} onClick={() => void state.confirm(row.id)}>Confirm {row.food_name}</button>
        </> : <p>Claim confirmed. Reservation retained.</p>}
      </div>
    })}
    <h3>Available donations</h3>
    {state.loading ? <p role="status">Loading available donations…</p>
      : !state.donations.length ? <p>No available donations.</p>
      : state.donations.map(row => <div key={row.id}><DonationDetails donation={row} />
        <button disabled={state.pending} onClick={() => void state.reserve(row.id)}>Reserve {row.food_name}</button>
      </div>)}
  </section>
}
