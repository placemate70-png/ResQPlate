import { donationClient } from './donationService'
import { validateImage } from './imageService'
import { parseAnalysis } from '../supabase/functions/snapfill/contract'
export type { FoodAnalysis } from '../supabase/functions/snapfill/contract'
export { analysisFields } from '../supabase/functions/snapfill/contract'
export async function analyzeFoodImage(photo: File) {
  validateImage(photo)
  const body=new FormData(); body.set('image',photo)
  const {data,error}=await donationClient().functions.invoke('snapfill',{body,timeout:55000})
  if (error) throw new Error('AI analysis unavailable. Retry later or continue with manual food entry.')
  try { return parseAnalysis(data) } catch { throw new Error('SnapFill returned an unusable estimate. Continue manually.') }
}
