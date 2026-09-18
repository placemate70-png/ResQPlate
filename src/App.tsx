import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './useAuth'
import { ProfileManagement } from './ProfileManagement'

function App() {
  const auth = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const path = window.location.pathname
  const dashboard = path === '/dashboard'
  const protectedArea = dashboard || /^\/(donor|volunteer|ngo)(\/|$)/.test(path)
  const callback = path === '/auth/callback'

  useEffect(() => {
    if (auth.loading) return
    if (auth.session && !protectedArea) window.location.replace('/dashboard')
    else if (!auth.session && protectedArea) window.location.replace('/login')
  }, [auth.loading, auth.session, protectedArea])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    await auth.submit(mode, String(values.get('email')).trim(), String(values.get('password')))
    form.reset()
  }

  if (auth.loading || (auth.session && !protectedArea) || (!auth.session && protectedArea)) {
    return <main><h1>ResQPlate</h1><p role="status">Loading session…</p></main>
  }

  return (
    <main>
      <h1>ResQPlate</h1>
      <p>Connect surplus food with the people who need it.</p>
      {auth.error && <p role="alert">{auth.error}</p>}
      {auth.notice && <p role="status">{auth.notice}</p>}
      {auth.session ? (
        <section>
          <h2>Your account</h2>
          <p>Signed in as {auth.session.user.email}</p>
          <ProfileManagement key={auth.session.user.id} userId={auth.session.user.id} />
          <button disabled={auth.pending} onClick={() => void auth.logout()}>
            {auth.pending ? 'Logging out…' : 'Log out'}
          </button>
        </section>
      ) : callback ? (
        <section>
          <h2>Email confirmation</h2>
          <p>No signed-in session was received. The link may be invalid or expired. Try signing in if your email is confirmed.</p>
          <a href="/login">Return to login</a>
        </section>
      ) : (
        <section>
          <h2>{mode === 'signup' ? 'Create an account' : 'Log in'}</h2>
          <form key={mode} onSubmit={submit}>
            <fieldset disabled={auth.pending}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={mode === 'signup' ? 8 : undefined} required />
              {mode === 'signup' && <p>Use at least 8 characters. Confirm your email before logging in.</p>}
              <button type="submit">{auth.pending ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Log in'}</button>
            </fieldset>
          </form>
          <button type="button" disabled={auth.pending} onClick={() => {
            auth.clearFeedback()
            setMode(mode === 'login' ? 'signup' : 'login')
          }}>
            {mode === 'login' ? 'Create an account' : 'Back to login'}
          </button>
        </section>
      )}
    </main>
  )
}

export default App
