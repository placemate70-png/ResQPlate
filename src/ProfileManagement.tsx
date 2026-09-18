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
import { EmptyState, Icon, LoadingState } from './UI'

export function ProfileManagement({ userId }: { userId: string }) {
  const state = useProfile(userId)
  const requestedRole = window.location.pathname.split('/')[1]
  useEffect(() => {
    if (state.profile && requestedRole === 'dashboard') {
      window.location.replace(`/${state.profile.role}`)
    }
  }, [state.profile, requestedRole])

  if (state.profile && requestedRole !== state.profile.role && requestedRole !== 'dashboard') {
    return <section className="guard-panel" id="main-content"><EmptyState title="Access denied" description="This area requires a different role. Your own dashboard is ready for you."
      action={<a className="button-link" href={`/${state.profile.role}`}>Return to your dashboard <Icon name="arrow" /></a>} /></section>
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const role = String(new FormData(event.currentTarget).get('role'))
    if (isRole(role)) await state.choose(role)
  }

  if (state.loading) return <div className="guard-panel"><LoadingState label="Loading profile…" /></div>

  return (
    <section className={state.profile ? 'app-shell' : 'role-onboarding'} aria-label="Role profile">
      {state.error && <p role="alert">{state.error}</p>}
      {state.profile ? (
        <>
          <aside className="app-sidebar"><p className="nav-label">{state.profile.role === 'ngo' ? 'NGO' : state.profile.role === 'donor' ? 'Donor' : 'Volunteer'} workspace</p>
            <nav aria-label="Main navigation">
              <a className={window.location.pathname === `/${state.profile.role}` ? 'active' : ''} href={`/${state.profile.role}`} aria-current={window.location.pathname === `/${state.profile.role}` ? 'page' : undefined}><Icon name="grid" />Overview</a>
              {state.profile.role === 'donor' && <>
                <a className={window.location.pathname === '/donor/new' ? 'active' : ''} aria-current={window.location.pathname === '/donor/new' ? 'page' : undefined} href="/donor/new"><Icon name="plus" />Create donation</a>
                <a className={window.location.pathname === '/donor/history' ? 'active' : ''} aria-current={window.location.pathname === '/donor/history' ? 'page' : undefined} href="/donor/history"><Icon name="history" />Donation history</a>
              </>}
              {state.profile.role === 'volunteer' && <a className={window.location.pathname === '/volunteer/grabboard' ? 'active' : ''} aria-current={window.location.pathname === '/volunteer/grabboard' ? 'page' : undefined} href="/volunteer/grabboard"><Icon name="food" />GrabBoard</a>}
            </nav><div className="sidebar-bottom"><span className="role-chip">{state.profile.role === 'ngo' ? 'NGO' : state.profile.role === 'donor' ? 'Donor' : 'Volunteer'} workspace</span><p>Good food deserves<br />a second chance.</p><Icon name="plate" /></div>
          </aside><div className="workspace" id="main-content">
          {state.profile.role === 'donor' && requestedRole === 'donor' &&
            (window.location.pathname === '/donor/new' ? <DonationForm userId={userId} />
              : window.location.pathname === '/donor/history' ? <DonationHistory userId={userId} />
              : <DonorDashboard userId={userId} />)}
          {state.profile.role === 'volunteer' && requestedRole === 'volunteer' &&
            (window.location.pathname === '/volunteer/grabboard' ? <GrabBoard userId={userId} /> : <VolunteerDashboard profile={state.profile} />)}
          {state.profile.role === 'ngo' && requestedRole === 'ngo' && <NGODashboard userId={userId} />}
          </div>
        </>
      ) : state.error ? (
        <button onClick={() => void state.retry()}>Retry profile</button>
      ) : (
        <>
          <p className="eyebrow">Make yourself at home</p><h2>Choose your role</h2>
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
