import type { Donation } from './donationService'
import { DonationImage } from './DonationImage'

export function DonationDetails({ donation }: { donation: Donation }) {
  return <article>
    <h3>{donation.food_name}</h3>
    <p>Status: {donation.status}</p>
    <p>{donation.food_type} · {donation.temperature_c}°C · {donation.quantity} {donation.quantity_unit}</p>
    {donation.description && <p>{donation.description}</p>}
    <p>{donation.container_count} container(s): {donation.container}</p>
    <p>Prepared: {new Date(donation.prepared_at).toLocaleString()}</p>
    <p>Created: {new Date(donation.created_at).toLocaleString()}</p>
    {donation.status === 'reserved' && donation.reservation_expires_at &&
      <p>Reserved until: {new Date(donation.reservation_expires_at).toLocaleString()}</p>}
    {donation.claimed_at && <p>Claim confirmed: {new Date(donation.claimed_at).toLocaleString()}</p>}
    <DonationImage key={donation.image_path} path={donation.image_path} />
  </article>
}
