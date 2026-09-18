import { useEffect } from 'react'
import type { FormEvent } from 'react'
import { isRole } from './profileService'
import { useProfile } from './useProfile'
import { DonorDashboard } from './DonorDashboard'
import { DonationForm } from './DonationForm'
import { DonationHistory } from './DonationHistory'
import { VolunteerDashboard } from './VolunteerDashboard'
import { GrabBoard } from './GrabBoard'
import { NGODashboard } from './NGODashboard'

export function ProfileManagement({ userId }: { userId: string }) {
  const state = useProfile(userId)
  const requestedRole = window.location.pathname.split('/')[1]
  useEffect(() => {
    if (state.profile && requestedRole === 'dashboard') {
      window.location.replace(`/${state.profile.role}`)
    }
  }, [state.profile, requestedRole])

  if (state.profile && requestedRole !== state.profile.role && requestedRole !== 'dashboard') {
    return <section><h2>Access denied</h2><p>This area requires a different role.</p>
      <a href={`/${state.profile.role}`}>Return to your dashboard</a></section>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const role = String(new FormData(event.currentTarget).get('role'))
    if (isRole(role)) await state.choose(role)
  }

  if (state.loading) return <p role="status">Loading profile…</p>

  return (
    <section aria-label="Role profile">
      {state.error && <p role="alert">{state.error}</p>}
      {state.profile ? (
        <>
          <h2>Your role</h2>
          <p role="status">Role: {state.profile.role === 'ngo' ? 'NGO' : state.profile.role === 'donor' ? 'Donor' : 'Volunteer'}</p>
          {state.profile.role === 'donor' && requestedRole === 'donor' &&
            (window.location.pathname === '/donor/new' ? <DonationForm userId={userId} />
              : window.location.pathname === '/donor/history' ? <DonationHistory userId={userId} />
              : <DonorDashboard userId={userId} />)}
          {state.profile.role === 'volunteer' && requestedRole === 'volunteer' &&
            (window.location.pathname === '/volunteer/grabboard' ? <GrabBoard userId={userId} /> : <VolunteerDashboard profile={state.profile} />)}
          {state.profile.role === 'ngo' && requestedRole === 'ngo' && <NGODashboard />}
        </>
      ) : state.error ? (
        <button onClick={() => void state.retry()}>Retry profile</button>
      ) : (
        <>
          <h2>Choose your role</h2>
          <p>Select the role you will use for this account. This choice is permanent.</p>
          <form onSubmit={submit}>
            <fieldset disabled={state.saving}>
              <label htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="" required>
                <option value="" disabled>Select a role</option>
                <option value="donor">Donor</option>
                <option value="volunteer">Volunteer</option>
                <option value="ngo">NGO</option>
              </select>
              <button type="submit">{state.saving ? 'Saving role…' : 'Save role'}</button>
            </fieldset>
          </form>
        </>
      )}
    </section>
  )
}
