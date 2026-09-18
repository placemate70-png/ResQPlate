import { useCallback, useEffect, useRef, useState } from 'react'
import { deviceLocation, saveRescueLocation } from './locationService'
import type { Coordinates } from './locationService'
import { asyncError } from './useDonations'

export function useRescueLocation(id: string, enabled: boolean, activity:string) {
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const active = useRef(true), busy = useRef(false)
  const capture = useCallback(async () => {
    if (!enabled || busy.current) return
    busy.current=true; setPending(true); setError('')
    try {
      const coordinates=await deviceLocation()
      if (!active.current) return
      const saved=await saveRescueLocation(id,coordinates)
      if (active.current) setLocation({latitude:saved.latest_volunteer_lat!,longitude:saved.latest_volunteer_lng!})
    } catch (reason) { if (active.current) setError(asyncError(reason)) }
    finally { busy.current=false; if (active.current) setPending(false) }
  }, [id,enabled])
  useEffect(() => {
    active.current=true
    // Opening a rescue refreshes an already-authorized device; new permission needs the button.
    if (enabled && navigator.permissions) void navigator.permissions.query({name:'geolocation'}).then(permission=> {
      if (active.current && permission.state==='granted') void capture()
    }).catch(()=>{})
    return () => { active.current=false }
  }, [capture,enabled,activity])
  return {location,pending,error,capture}
}
