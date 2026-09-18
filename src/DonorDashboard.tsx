import { useDonations } from './useDonations'
import { DonationDetails } from './DonationDetails'
import { EmptyState, Icon, LoadingState, PageHeading, Stat } from './UI'
import { useRescues } from './useRescues'
import { RescueTimeline } from './RescueTimeline'
import { ImpactStats } from './ImpactStats'

export function DonorDashboard({ userId }: { userId: string }) {
  const state = useDonations(userId)
  const progress=useRescues()
  return <section><PageHeading title="Donor dashboard" eyebrow="Your food, a new purpose" description="Welcome back. Here’s where your shared meals stand."
    action={<a className="button-link" href="/donor/new"><Icon name="plus" />Create donation</a>} />
    {state.loading ? <LoadingState label="Loading donations…" />
      : state.error ? <p role="alert">{state.error}</p>
      : <><ImpactStats donations={state.donations} rescues={progress.rescues} role="donor" loading={progress.loading} error={progress.error}/><div className="stats-grid">
        <Stat label="Total donations" value={state.donations.length} icon="food" detail="Every donation is a new opportunity" />
        <Stat label="Available" value={state.donations.filter(row => row.status === 'available').length} icon="clock" detail="Includes donations in the RouteBuddy hold" />
        <Stat label="Confirmed claims" value={state.donations.filter(row => row.status === 'claimed').length} icon="check" detail="Accepted by a volunteer" />
        </div><div className="feature-banner"><div><p className="eyebrow">Make room for something good</p><h3>Surplus today. Possibility tomorrow.</h3><p>Share your food details and pickup location. We’ll help volunteers find it when it’s ready.</p></div><a className="button-link button-secondary" href="/donor/new">Share a meal <Icon name="arrow" /></a></div>
        <div className="section-heading"><h3>Recent donations</h3><a href="/donor/history">View history <Icon name="arrow" /></a></div>
        {progress.error && <p role="alert">{progress.error}</p>}
        {!state.donations.length ? <EmptyState title="Your first donation starts here" description="Have good food to spare? Create a donation and give it a chance to reach someone new." action={<a className="button-link" href="/donor/new">Create donation</a>} />
          : <div className="donation-grid">{state.donations.slice(0, 4).map(row => <div className="donation-card" key={row.id}><DonationDetails donation={row} />{progress.loading?<LoadingState label="Loading rescue progress…"/>:!progress.error && <RescueTimeline donation={row} rescue={progress.rescues.find(r=>r.donation_id===row.id)} />}<div className="card-actions"><a href={`/donor/new?donation=${row.id}`}>View donation <Icon name="arrow" /></a></div></div>)}</div>}
        </>}
  </section>
}
