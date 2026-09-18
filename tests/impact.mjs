import assert from 'node:assert/strict'
import {impactTotals} from '../src/impactLogic.ts'
const donations=[{id:'a',quantity:3,quantity_unit:'kg'},{id:'b',quantity:1.5,quantity_unit:'litres'},{id:'pending',quantity:100,quantity_unit:'kg'}]
const rescues=[{donation_id:'a',completed_at:'2026-09-18',delivered_plates:8},{donation_id:'b',completed_at:'2026-09-18',delivered_plates:4},{donation_id:'pending',completed_at:null,delivered_plates:100},{donation_id:'other-role',completed_at:'2026-09-18',delivered_plates:100}]
assert.deepEqual(impactTotals(donations,rescues),{count:2,plates:12,food:'3 kg · 1.5 litres'})
assert.deepEqual(impactTotals([],[]),{count:0,plates:0,food:'0'})
console.log('PASS completed-only, role-scoped, mixed-unit and zero impact metrics')
