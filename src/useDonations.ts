import { useEffect, useState } from 'react'
import { createDonation, getDonation, ngoDonations, ownDonations } from './donationService'
import type { Donation, DonationInput } from './donationService'

export function asyncError(reason: unknown) {
  return reason && typeof reason === 'object' && 'message' in reason
    ? String(reason.message) : 'The operation failed. Please try again.'
}

export function useCreateDonation() {
  const savedId = new URLSearchParams(window.location.search).get('donation')
  const [restoring, setRestoring] = useState(Boolean(savedId))
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<Donation | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    if (savedId) void getDonation(savedId).then(row => { if (active) setResult(row) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
      .finally(() => { if (active) setRestoring(false) })
    return () => { active = false }
  }, [savedId])
  async function submit(input: DonationInput) {
    setSaving(true); setError(null); setResult(null)
    try {
      const row = await createDonation(input)
      window.history.replaceState(null, '', `/donor/new?donation=${row.id}`)
      setResult(row)
    }
    catch (reason) { setError(asyncError(reason)) }
    finally { setSaving(false) }
  }
  return { saving, restoring, result, error, submit }
}

export function useDonations(donorId: string) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void ownDonations(donorId).then(rows => { if (active) setDonations(rows) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [donorId])
  return { donations, loading, error }
}

export function useNGODonations() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void ngoDonations().then(rows => { if (active) setDonations(rows) })
      .catch((reason: unknown) => { if (active) setError(asyncError(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return { donations, loading, error }
}
