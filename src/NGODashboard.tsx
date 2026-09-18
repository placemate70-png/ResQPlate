import { DonationDetails } from './DonationDetails'
import { useNGODonations } from './useDonations'

export function NGODashboard() {
  const state = useNGODonations()
  return <section><h2>NGO dashboard</h2>
    <p>Shared donation information and current status. Refresh to update.</p>
    {state.loading ? <p role="status">Loading donations…</p> : state.error ? <p role="alert">{state.error}</p>
      : !state.donations.length ? <p>No donations yet.</p>
      : <><p>Donations: {state.donations.length}. Confirmed claims: {state.donations.filter(row => row.status === 'claimed').length}.</p>
        {state.donations.map(row => <DonationDetails key={row.id} donation={row} />)}</>}
  </section>
}
