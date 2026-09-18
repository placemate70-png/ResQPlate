import { useDonations } from './useDonations'

export function DonorDashboard({ userId }: { userId: string }) {
  const state = useDonations(userId)
  return <section><h2>Donor dashboard</h2>
    <a href="/donor/new">Create donation</a>
    {' · '}<a href="/donor/history">Donation history</a>
    {state.loading ? <p role="status">Loading donations…</p>
      : state.error ? <p role="alert">{state.error}</p>
      : <><p>Total donations: {state.donations.length}</p>
        <p>Available: {state.donations.filter(row => row.status === 'available').length}</p>
        {!state.donations.length && <p>No donations yet.</p>}</>}
  </section>
}
