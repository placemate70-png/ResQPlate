import type { Donation } from './donationService'
import { DonationImage } from './DonationImage'
import { FoodMetrics } from './FoodMetrics'
import { StatusBadge } from './UI'

export function DonationDetails({ donation, editable = false }: { donation: Donation; editable?: boolean }) {
  return <article className="donation-details">
    <div className="donation-title"><h3>{donation.food_name}</h3><StatusBadge status={donation.status} /></div>
    <div className="food-summary"><strong>{donation.quantity} {donation.quantity_unit}</strong><span>·</span><span className="food-type">{donation.food_type}</span><span>·</span><span>{donation.temperature_c}°C</span></div>
    <DonationImage key={donation.image_path} path={donation.image_path} />
    {donation.description && <p className="donation-description">{donation.description}</p>}
    <div className="donation-meta"><p>{donation.container_count} container(s): {donation.container}</p>
    <p>Prepared: {new Date(donation.prepared_at).toLocaleString()}</p>
    <p>Created: {new Date(donation.created_at).toLocaleString()}</p></div>
    <FoodMetrics key={`${donation.id}-${donation.corrected_plates}`} donation={donation} editable={editable} />
    {donation.status === 'reserved' && donation.reservation_expires_at &&
      <p>Reserved until: {new Date(donation.reservation_expires_at).toLocaleString()}</p>}
    {donation.claimed_at && <p>Claim confirmed: {new Date(donation.claimed_at).toLocaleString()}</p>}
  </article>
}
