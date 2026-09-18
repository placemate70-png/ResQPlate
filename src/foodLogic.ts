export function calculateFreshness(foodType: 'gravy' | 'dry' | 'rice', temperature: number, preparedAt: string, now = Date.now()) {
  const prepared = Date.parse(preparedAt)
  if (!Number.isFinite(prepared) || !Number.isFinite(temperature)) throw new Error('Invalid freshness inputs')
  const hours = (foodType === 'gravy' ? 1.5 : 4) + (temperature < 30 ? 1 : 0)
  const expiresAt = prepared + hours * 3600000
  return { hours, expiresAt, remainingMs: Math.max(0, expiresAt - now), expired: now >= expiresAt }
}

// Operational urgency thresholds; the stored FreshClock deadline remains authoritative.
export function deadlineState(expiresAt: string, now = Date.now()) {
  const deadline = Date.parse(expiresAt)
  if (!Number.isFinite(deadline)) throw new Error('Invalid deadline')
  const remainingMs = Math.max(0, deadline - now)
  const urgency = remainingMs === 0 ? 'EXPIRED' : remainingMs <= 900000 ? 'CRITICAL' : remainingMs <= 3600000 ? 'WARNING' : 'NORMAL'
  return { remainingMs, urgency }
}

// Prototype serving assumptions: 300 g or 300 ml per plate; portions already count plates.
export function estimatePlates(quantity: number, unit: 'kg' | 'litres' | 'portions', containers: number, capacityLitres?: number | null) {
  if (!(quantity > 0) || !Number.isInteger(containers) || containers < 1 || (capacityLitres != null && !(capacityLitres > 0))) throw new Error('Invalid quantity/container inputs')
  if (unit === 'litres' && capacityLitres != null && quantity > containers * capacityLitres) throw new Error('Quantity exceeds container capacity')
  return Math.floor(unit === 'portions' ? quantity : quantity / 0.3)
}
