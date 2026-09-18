import type {Donation} from './donationService'
import type {Rescue} from './rescueService'
export function impactTotals(donations:Donation[],rescues:Rescue[]) {
  const rows=new Map(donations.map(d=>[d.id,d]))
  const completed=rescues.filter(r=>r.completed_at && rows.has(r.donation_id))
  const quantities:Record<string,number>={}
  for(const rescue of completed) {
    const donation=rows.get(rescue.donation_id)!
    quantities[donation.quantity_unit]=(quantities[donation.quantity_unit]??0)+donation.quantity
  }
  const food=Object.entries(quantities).map(([unit,amount])=>`${Number(amount.toFixed(2)).toLocaleString()} ${unit}`).join(' · ') || '0'
  return {count:completed.length,plates:completed.reduce((total,r)=>total+(r.delivered_plates??0),0),food}
}
