import { useCallback, useEffect, useState } from 'react'
import { rescueState } from './rescueService'
import type { Availability, Rescue, Impact } from './rescueService'
import { asyncError } from './useDonations'
export function useRescues() {
  const [data, setData] = useState<{ availability: Availability[]; rescues: Rescue[]; impact: Impact[] }>({ availability: [], rescues: [], impact: [] })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await rescueState()) } catch (reason) { setError(asyncError(reason)) } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    void rescueState().then(result => { if (active) setData(result) }).catch(reason => { if (active) setError(asyncError(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function act(operation: () => Promise<void>) {
    setPending(true); setError(''); setNotice('')
    try { await operation(); await refresh(); setNotice('Saved to Supabase.') } catch (reason) { setError(asyncError(reason)) } finally { setPending(false) }
  }
  return { ...data, loading, pending, error, notice, refresh, act }
}
