import type {Donation} from './donationService'
import type {Rescue} from './rescueService'
import {rescueStage} from './rescueLogic'
export function RescueTimeline({donation,rescue}:{donation:Donation;rescue?:Rescue}) {
  const steps=[['Donation Posted',donation.created_at],['Volunteer Assigned',rescue?.assigned_at??donation.claimed_at],['Pickup Started',rescue?.pickup_started_at],['Picked Up',rescue?.picked_up_at],['On the Way',rescue?.delivery_started_at],['Delivered',rescue?.delivered_at],['Completed',rescue?.completed_at]]
  return <section className="route-panel" aria-label={`Rescue progress for ${donation.food_name}`}><strong>Rescue progress · {rescue?rescueStage(rescue):donation.status==='available'?'POSTED':'RESERVED'}</strong>
    <ol className="rescue-timeline">{steps.map(([label,timestamp])=><li key={label} className={timestamp?'done':''}><span aria-hidden="true">{timestamp?'✓':'○'}</span> {label}<small>{timestamp?<time dateTime={timestamp}>{new Date(timestamp).toLocaleString()}</time>:rescue?.completed_at?'Not recorded in legacy rescue':'Pending'}</small></li>)}</ol>
  </section>
}
