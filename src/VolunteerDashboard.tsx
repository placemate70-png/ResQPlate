import type { Profile } from './profileService'
import { useGrabBoard } from './useGrabBoard'
import { DonationDetails } from './DonationDetails'
import { EmptyState, Icon, LoadingState, PageHeading, Stat } from './UI'
import { useRescues } from './useRescues'
import { ImpactStats } from './ImpactStats'

export function VolunteerDashboard({ profile }: { profile: Profile }) {
  const state = useGrabBoard(profile.id)
  const progress=useRescues()
  return <section><PageHeading title="Volunteer dashboard" eyebrow="Be the connection" description="Good food is waiting for its next chapter. Help it get there."
    action={<a className="button-link" href="/volunteer/grabboard">Open GrabBoard <Icon name="arrow" /></a>} />
    {state.loading ? <LoadingState label="Loading reservation state…" />
      : state.error ? <p role="alert">{state.error}</p>
      : <><ImpactStats donations={state.reservations} rescues={progress.rescues} role="volunteer" loading={progress.loading} error={progress.error}/><div className="stats-grid"><Stat label="Available donations" value={state.donations.length} icon="food" detail="Released and ready to reserve" />
        <Stat label="Your reservations" value={state.reservations.filter(row => row.status === 'reserved').length} icon="clock" detail="Confirm within the 60-second window" />
        <Stat label="Confirmed claims" value={state.reservations.filter(row => row.status === 'claimed').length} icon="check" detail="Your accepted food rescues" /></div>
        <div className="feature-banner"><div><p className="eyebrow">From one neighbour to another</p><h3>A small action. A meaningful connection.</h3><p>Browse real donations, reserve a meal, and confirm your claim within 60 seconds.</p></div><a className="button-link button-secondary" href="/volunteer/grabboard">Find a donation <Icon name="arrow" /></a></div>
        <div className="section-heading"><h3>Your reservations & claims</h3><a href="/volunteer/grabboard">Manage on GrabBoard <Icon name="arrow" /></a></div>
        {!state.reservations.length ? <EmptyState title="Your next rescue is out there" description="You haven’t reserved any food yet. Visit GrabBoard to see what’s ready to share." action={<a className="button-link" href="/volunteer/grabboard">Browse GrabBoard</a>} />
          : <div className="donation-grid">{state.reservations.slice(0,4).map(row=><div className="donation-card" key={row.id}><DonationDetails donation={row} /></div>)}</div>}</>}
  </section>
}
