import { useEffect, useState } from 'react'
import { imageUrl } from './imageService'
import { asyncError } from './useDonations'

export function DonationImage({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (path) void imageUrl(path).then(value => { if (active) setUrl(value) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
    return () => { active = false }
  }, [path])
  if (!path) return <p>No image attached.</p>
  if (error) return <p role="alert">Image unavailable: {error}</p>
  return url ? <img src={url} alt="Donated food" width="240" onError={() => setError('Could not load image. Refresh to retry.')} />
    : <p role="status">Loading image…</p>
}
