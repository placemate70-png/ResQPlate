import { useCallback, useEffect, useState } from 'react'
import { rescueState } from './rescueService'
import type { Availability, Rescue, Impact } from './rescueService'
import { asyncError } from './useDonations'
import { watchDatabase } from './databaseSync'
export function useRescues() {
  const [data, setData] = useState<{ availability: Availability[]; rescues: Rescue[]; impact: Impact[] }>({ availability: [], rescues: [], impact: [] })
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [live,setLive]=useState(false)
  const refresh = useCallback(async () => {
    setError('')
    try { setData(await rescueState()) } catch (reason) { setError(asyncError(reason)) } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    let sequence=0
    const load=()=>{const current=++sequence;void rescueState().then(result => { if (active && current===sequence) {setData(result);setError('')} }).catch(reason => { if (active && current===sequence) setError(asyncError(reason)) }).finally(() => { if (active && current===sequence) setLoading(false) })}
    load()
    const stop=watchDatabase(['rescues','ngo_availability'],load,value=>{if(active)setLive(value)})
    return () => { active = false;stop() }
  }, [])
  async function act(operation: () => Promise<void>) {
    setPending(true); setError(''); setNotice('')
    try { await operation(); await refresh(); setNotice('Saved to Supabase.') } catch (reason) { setError(asyncError(reason)) } finally { setPending(false) }
  }
  return { ...data, loading, pending, error, notice, refresh, act, live }
}
