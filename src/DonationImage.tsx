import { useEffect, useState } from 'react'
import { imageUrl } from './imageService'
import { asyncError } from './useDonations'
import { Icon } from './UI'

export function DonationImage({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (path) void imageUrl(path).then(value => { if (active) setUrl(value) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
    return () => { active = false }
  }, [path])
  if (!path) return <p className="image-empty"><Icon name="image" />No image attached.</p>
  if (error) return <p role="alert">Image unavailable: {error}</p>
  return url ? <img className="food-image" src={url} alt="Donated food" width="240" loading="lazy" onError={() => setError('Could not load image. Refresh to retry.')} />
    : <p className="image-empty" role="status"><span className="spinner" />Loading image…</p>
}
