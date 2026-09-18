import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './useAuth'
import { ProfileManagement } from './ProfileManagement'
import { Brand, Icon, LoadingState } from './UI'

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
    return <main className="session-loading"><Brand /><LoadingState label="Loading session…" /></main>
  }

  return (
    <main className={auth.session ? 'app-root' : 'auth-root'}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      {auth.session ? (
        <>
          <header className="app-header"><Brand /><span className="header-purpose">A little surplus. A lot of possibility.</span>
            <div className="account-controls"><span className="avatar" aria-hidden="true">{auth.session.user.email?.slice(0, 1).toUpperCase()}</span>
              <span className="account-email">{auth.session.user.email}</span>
              <button className="button-quiet" disabled={auth.pending} onClick={() => void auth.logout()}>{auth.pending ? 'Logging out…' : 'Log out'}</button>
            </div>
          </header>
          {auth.error && <p className="global-feedback" role="alert">{auth.error}</p>}
          {auth.notice && <p className="global-feedback" role="status">{auth.notice}</p>}
          <ProfileManagement key={auth.session.user.id} userId={auth.session.user.id} />
        </>
      ) : <div className="auth-layout">
        <aside className="auth-story"><Brand /><div className="auth-story-content"><p className="eyebrow">Good food. Greater purpose.</p>
          <h1>More than a plate.<br /><span>A new possibility.</span></h1><p>Connect surplus food with the people who need it. One thoughtful donation at a time.</p>
          <div className="plate-art" aria-hidden="true"><span className="plate-ring"><Icon name="food" /></span><span className="art-label"><Icon name="check" /> Every meal matters</span></div>
          <div className="rescue-path"><span>Donate</span><Icon name="arrow" /><span>Rescue</span><Icon name="arrow" /><span>Share</span></div>
        </div><p className="auth-story-footer">Built around food, freshness, and community.</p></aside>
        <section className="auth-panel" id="main-content">
          <div className="auth-panel-inner"><p className="eyebrow">Welcome to ResQPlate</p>
          {auth.error && <p role="alert">{auth.error}</p>}{auth.notice && <p role="status">{auth.notice}</p>}
          {callback ? <>
          <h2>Email confirmation</h2>
          <p>No signed-in session was received. The link may be invalid or expired. Try signing in if your email is confirmed.</p>
          <a className="button-link" href="/login">Return to login <Icon name="arrow" /></a>
          </> : <>
          <h2>{mode === 'signup' ? 'Create an account' : 'Log in'}</h2>
          <p className="auth-description">{mode === 'signup' ? 'Your next chapter starts with a meal worth sharing.' : 'Welcome back. Let’s put good food to good use.'}</p>
          <form className="auth-form" key={mode} onSubmit={submit}>
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
          <div className="auth-switch"><span>{mode === 'login' ? 'New to the community?' : 'Already have an account?'}</span><button className="button-text" type="button" disabled={auth.pending} onClick={() => {
            auth.clearFeedback()
            setMode(mode === 'login' ? 'signup' : 'login')
          }}>
            {mode === 'login' ? 'Create an account' : 'Back to login'}
          </button></div><p className="auth-footnote">Real connections. Less waste. More shared meals.</p>
          </>}
          </div>
        </section>
      </div>}
    </main>
  )
}

export default App
