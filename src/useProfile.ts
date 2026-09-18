import { useEffect, useState } from 'react'
import { createProfile, getProfile } from './profileService'
import type { Profile, Role } from './profileService'

function message(reason: unknown) {
  return reason && typeof reason === 'object' && 'message' in reason
    ? String(reason.message) : 'Could not load or save your profile. Please try again.'
}

export function useProfile(id: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void getProfile(id).then(result => {
      if (active) setProfile(result)
    }).catch((reason: unknown) => {
      if (active) setError(message(reason))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  async function retry() {
    setLoading(true)
    setError(null)
    try { setProfile(await getProfile(id)) }
    catch (reason) { setError(message(reason)) }
    finally { setLoading(false) }
  }

  async function choose(role: Role) {
    setSaving(true)
    setError(null)
    try { setProfile(await createProfile(id, role)) }
    catch (reason) { setError(message(reason)) }
    finally { setSaving(false) }
  }

  return { profile, loading, saving, error, retry, choose }
}
