import { donationClient } from './donationService'
import type { Donation } from './donationService'

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export function validateImage(file: File) {
  if (!extensions[file.type]) throw new Error('Choose a JPEG, PNG, or WebP image.')
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Image must be nonempty and at most 5 MB.')
}

export async function uploadImage(file: File, userId: string, donationId: string): Promise<Donation> {
  validateImage(file)
  const client = donationClient()
  const path = `${userId}/${donationId}/${crypto.randomUUID()}.${extensions[file.type]}`
  const { error: uploadError } = await client.storage.from('food-images').upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError
  const { data, error } = await client.from('donations').update({ image_path: path }).eq('id', donationId).select('*').single()
  if (error) {
    const cleanup = await client.storage.from('food-images').remove([path])
    throw new Error(`${error.message}${cleanup.error ? ' Unattached image cleanup also failed.' : ''}`)
  }
  return data
}

export async function imageUrl(path: string) {
  const { data, error } = await donationClient().storage.from('food-images').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
