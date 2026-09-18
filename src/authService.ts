import { supabase } from './supabase'

export function authClient() {
  if (!supabase) throw new Error('Supabase connection is not configured.')
  return supabase.auth
}

export async function signUp(email: string, password: string) {
  const { data, error } = await authClient().signUp({
    email, password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await authClient().signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await authClient().signOut({ scope: 'local' })
  if (error) throw error
}
