import assert from 'node:assert/strict'
import { calculateFreshness, estimatePlates } from '../src/foodLogic.ts'
const prepared = '2026-09-18T00:00:00Z'
for (const type of ['gravy', 'dry', 'rice']) for (const temperature of [29.9, 30, 38, 38.1]) {
  const expected = (type === 'gravy' ? 1.5 : 4) + (temperature < 30 ? 1 : 0)
  const result = calculateFreshness(type, temperature, prepared, Date.parse(prepared))
  assert.equal(result.hours, expected)
  assert.equal(result.remainingMs, expected * 3600000)
  assert.equal(calculateFreshness(type, temperature, prepared, result.expiresAt).expired, true)
}
assert.equal(estimatePlates(3, 'kg', 2), 10)
assert.equal(estimatePlates(1.5, 'litres', 2, 1), 5)
assert.equal(estimatePlates(8, 'portions', 1), 8)
assert.throws(() => estimatePlates(3, 'litres', 1, 2))
assert.throws(() => estimatePlates(0, 'kg', 1))
console.log('PASS FreshClock temperature/food/expiry boundaries and PlateCount quantities/capacity.')
