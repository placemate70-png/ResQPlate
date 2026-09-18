import { DonationDetails } from './DonationDetails'
import { useDonations } from './useDonations'

export function DonationHistory({ userId }: { userId: string }) {
  const state = useDonations(userId)
  return <section><h2>Your donation history</h2><a href="/donor">Donor dashboard</a>
    {state.loading ? <p role="status">Loading history…</p> : state.error ? <p role="alert">{state.error}</p>
      : !state.donations.length ? <p>No donations yet.</p>
      : state.donations.map(row => <div key={row.id}>
        <DonationDetails donation={row} />
        <a href={`/donor/new?donation=${row.id}`}>View donation / attach image</a>
      </div>)}
  </section>
}
