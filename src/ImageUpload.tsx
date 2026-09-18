import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { uploadImage } from './imageService'
import { DonationImage } from './DonationImage'
import { asyncError } from './useDonations'
import { Icon } from './UI'

export function ImageUpload({ userId, donationId, imagePath, selectedFile }: { userId: string; donationId: string; imagePath: string | null; selectedFile?: File | null }) {
  const [path, setPath] = useState(imagePath)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(() => selectedFile ? URL.createObjectURL(selectedFile) : null)
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const chosen = new FormData(event.currentTarget).get('image')
    const file = chosen instanceof File && chosen.size ? chosen : selectedFile
    if (!(file instanceof File)) return
    setPending(true); setError(null)
    try { const donation = await uploadImage(file, userId, donationId); setPath(donation.image_path) }
    catch (reason) { setError(asyncError(reason)) }
    finally { setPending(false) }
  }
  return <section className="upload-panel"><h3>Food image</h3><p>A clear photo helps volunteers recognise what you’re sharing.</p>
    {error && <p role="alert">{error}</p>}
    {path ? <><p role="status">Image attached.</p><DonationImage key={path} path={path} /></> :
      <form onSubmit={submit}><fieldset disabled={pending}>
        <label htmlFor={`image-${donationId}`}>Food image (JPEG, PNG, WebP; max 5 MB)</label>
        {selectedFile && <p>Selected SnapFill photo: {selectedFile.name}. Upload it here or choose another image.</p>}
        <input id={`image-${donationId}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!selectedFile} onChange={event => {
          const file = event.target.files?.[0]
          setPreview(file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024 ? URL.createObjectURL(file) : null)
        }} />
        {preview && <img className="upload-preview" src={preview} alt="Selected food preview" />}
        <button type="submit"><Icon name="image" />{pending ? 'Uploading image…' : 'Upload image'}</button>
      </fieldset></form>}
  </section>
}
