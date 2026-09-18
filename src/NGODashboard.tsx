import { DonationDetails } from './DonationDetails'
import { useNGODonations } from './useDonations'
import { EmptyState, LoadingState, PageHeading, Stat } from './UI'

export function NGODashboard() {
  const state = useNGODonations()
  return <section><PageHeading title="NGO dashboard" eyebrow="A shared view of the community" description="Follow shared food and confirmed claims. Refresh this page for the latest information." />
    {state.loading ? <LoadingState label="Loading donations…" /> : state.error ? <p role="alert">{state.error}</p>
      : <><div className="stats-grid"><Stat label="Shared donations" value={state.donations.length} icon="food" detail="Real donations across the community" />
        <Stat label="Reserved" value={state.donations.filter(row=>row.status==='reserved').length} icon="clock" detail="Awaiting volunteer confirmation" />
        <Stat label="Confirmed claims" value={state.donations.filter(row=>row.status==='claimed').length} icon="check" detail="Food accepted by volunteers" /></div>
        <div className="section-heading"><h3>Community donations</h3><span className="role-chip">Read-only view</span></div>
        {!state.donations.length ? <EmptyState title="A new community begins with a meal" description="Donations will appear here as donors start sharing. You’ll be able to follow their food details and status." />
          : <div className="donation-grid">{state.donations.map(row => <div className="donation-card" key={row.id}><DonationDetails donation={row} /></div>)}</div>}</>}
  </section>
}
