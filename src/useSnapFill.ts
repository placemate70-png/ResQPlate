import { useRef, useState } from 'react'
import { analyzeFoodImage } from './snapFillService'
import type { FoodAnalysis } from './snapFillService'
import { validateImage } from './imageService'
export function useSnapFill() {
  const [photo,setPhoto]=useState<File | null>(null)
  const [result,setResult]=useState<FoodAnalysis | null>(null)
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const locked=useRef(false)
  function select(file: File | null): File | null {
    setResult(null); setError(''); setPhoto(null)
    if (!file) return null
    try { validateImage(file); setPhoto(file); return file } catch(reason) { setError(reason instanceof Error ? reason.message : 'Invalid image.'); return null }
  }
  async function analyze() {
    if (!photo || locked.current) return
    locked.current=true; setPending(true); setResult(null); setError('')
    try { setResult(await analyzeFoodImage(photo)) }
    catch(reason) { setError(reason instanceof Error ? reason.message : 'Image analysis failed. Continue manually.') }
    finally { locked.current=false; setPending(false) }
  }
  return {photo,result,pending,error,select,analyze}
}
