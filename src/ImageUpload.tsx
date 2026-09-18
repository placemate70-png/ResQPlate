import { useState } from 'react'
import type { FormEvent } from 'react'
import { uploadImage } from './imageService'
import { DonationImage } from './DonationImage'
import { asyncError } from './useDonations'

export function ImageUpload({ userId, donationId, imagePath }: { userId: string; donationId: string; imagePath: string | null }) {
  const [path, setPath] = useState(imagePath)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('image')
    if (!(file instanceof File)) return
    setPending(true); setError(null)
    try { const donation = await uploadImage(file, userId, donationId); setPath(donation.image_path) }
    catch (reason) { setError(asyncError(reason)) }
    finally { setPending(false) }
  }
  return <section><h3>Food image</h3>
    {error && <p role="alert">{error}</p>}
    {path ? <><p role="status">Image attached.</p><DonationImage key={path} path={path} /></> :
      <form onSubmit={submit}><fieldset disabled={pending}>
        <label htmlFor={`image-${donationId}`}>Food image (JPEG, PNG, WebP; max 5 MB)</label>
        <input id={`image-${donationId}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        <button type="submit">{pending ? 'Uploading image…' : 'Upload image'}</button>
      </fieldset></form>}
  </section>
}
