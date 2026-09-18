import type { Profile } from './profileService'
import { useGrabBoard } from './useGrabBoard'

export function VolunteerDashboard({ profile }: { profile: Profile }) {
  const state = useGrabBoard(profile.id)
  return <section><h2>Volunteer dashboard</h2>
    <p>Your persisted account role: {profile.role}.</p>
    {state.loading ? <p role="status">Loading reservation state…</p>
      : state.error ? <p role="alert">{state.error}</p>
      : <p>Your reservations/claims: {state.reservations.length}. Available donations: {state.donations.length}.</p>}
    <a href="/volunteer/grabboard">Open GrabBoard</a>
  </section>
}
