import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { signIn, signOut, signUp } from './authService'
import { supabase } from './supabase'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Authentication failed. Please try again.'
}

// Capture callback errors before the SDK cleans the URL.
const callbackError = new URLSearchParams(window.location.hash.slice(1)).get('error_description')
  ?? new URLSearchParams(window.location.search).get('error_description')

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(callbackError ?? (supabase ? null : 'Supabase connection is not configured.'))
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true
    let changed = false
      const auth = supabase.auth
      const { data: { subscription } } = auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return
        changed = true
        setSession(nextSession)
      })
      void auth.getSession().then(({ data, error: sessionError }) => {
        if (!active) return
        if (!changed) setSession(data.session)
        if (sessionError) setError(sessionError.message)
        setLoading(false)
      }).catch((reason: unknown) => {
        if (active) { setError(errorMessage(reason)); setLoading(false) }
      })
      return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function submit(mode: 'login' | 'signup', email: string, password: string) {
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      const data = await (mode === 'signup' ? signUp(email, password) : signIn(email, password))
      setSession(data.session)
      if (!data.session) setNotice('Check your email for a confirmation link, then return to sign in. If you already have an account, use Log in.')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally { setPending(false) }
  }

  async function logout() {
    setPending(true)
    setError(null)
    try { await signOut(); setSession(null) }
    catch (reason) { setError(errorMessage(reason)) }
    finally { setPending(false) }
  }

  function clearFeedback() { setError(null); setNotice(null) }

  return { session, loading, pending, error, notice, submit, logout, clearFeedback }
}
