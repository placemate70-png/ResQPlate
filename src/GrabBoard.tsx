import { DonationDetails } from './DonationDetails'
import { useGrabBoard } from './useGrabBoard'
import { EmptyState, Icon, LoadingState, PageHeading } from './UI'
import { RescuePanel } from './RescuePanel'

export function GrabBoard({ userId }: { userId: string }) {
  const state = useGrabBoard(userId)
  return <section><PageHeading title="GrabBoard" eyebrow="Find your next food rescue" description="Real donations, ready to share. Reserve first, then confirm within 60 seconds."
    action={<button className="button-secondary" disabled={state.loading} onClick={() => void state.refresh()}><Icon name="history" />{state.loading ? 'Refreshing…' : 'Refresh donations'}</button>} />
    {state.error && <p role="alert">{state.error}</p>}
    {state.notice && <p role="status">{state.notice}</p>}
    {!state.loading && <RescuePanel userId={userId} role="volunteer" donations={state.reservations} />}
    <div className="section-heading"><h3>Your reservations</h3><span className="role-chip">60-second confirmation window</span></div>
    {!state.reservations.length && !state.loading && <EmptyState title="No reservations yet" description="Choose a donation below to hold it while you confirm. Your accepted claims will appear here too." />}
    <div className="donation-grid">
    {state.reservations.map(row => {
      const seconds = state.serverNow === null || !row.reservation_expires_at ? 0
        : Math.max(0, Math.ceil((Date.parse(row.reservation_expires_at) - state.serverNow) / 1000))
      return <div className="donation-card" key={row.id}><DonationDetails donation={row} />
        {row.status === 'reserved' ? <div className={`reservation-panel ${seconds <= 15 ? 'urgent' : ''}`}>
          <div className="reservation-countdown"><span>Confirm your rescue</span><strong>{seconds}s</strong></div>
          <progress aria-label="Reservation seconds remaining" max={60} value={Math.min(60, seconds)} />
          <p>Reservation ends: {row.reservation_expires_at && new Date(row.reservation_expires_at).toLocaleString()}</p>
          <button disabled={state.pending || !seconds} onClick={() => void state.confirm(row.id)}>{state.pending ? 'Please wait…' : `Confirm ${row.food_name}`}</button>
        </div> : <div className="confirmed-note"><Icon name="check" />Claim confirmed. Reservation retained.</div>}
      </div>
    })}</div>
    <div className="section-heading"><h3>Available donations</h3><span className="role-chip">{state.donations.length} available</span></div>
    {state.loading ? <LoadingState label="Loading available donations…" />
      : !state.donations.length ? <EmptyState title="Nothing ready to reserve right now" description="New donations appear after their RouteBuddy matching window. This board updates automatically; check back soon." />
      : <div className="donation-grid">{state.donations.map(row => <div className="donation-card" key={row.id}><DonationDetails donation={row} />
        <div className="card-actions"><button disabled={state.pending} onClick={() => void state.reserve(row.id)}>{state.pending ? 'Please wait…' : `Reserve ${row.food_name}`}<Icon name="arrow" /></button></div>
      </div>)}</div>}
  </section>
}
