import { supabase } from './supabase'

export const roles = ['donor', 'volunteer', 'ngo'] as const
export type Role = typeof roles[number]
export type Profile = { id: string; role: Role }

export function isRole(value: string): value is Role {
  return roles.some(role => role === value)
}

function client() {
  if (!supabase) throw new Error('Supabase connection is not configured.')
  return supabase
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await client().from('profiles').select('id, role').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createProfile(id: string, role: Role): Promise<Profile> {
  const { data, error } = await client().from('profiles').insert({ id, role }).select('id, role').single()
  if (error?.code === '23505') {
    // Concurrent tabs may submit different choices; display the database winner.
    const existing = await getProfile(id)
    if (existing) return existing
  }
  if (error) throw error
  return data
}
