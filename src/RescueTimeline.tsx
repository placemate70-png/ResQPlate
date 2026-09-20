import type {Donation} from './donationService'
import type {Rescue} from './rescueService'
import {rescueStage} from './rescueLogic'
export function RescueTimeline({donation,rescue}:{donation:Donation;rescue?:Rescue}) {
  const steps=[['Donation Posted',donation.created_at],['Volunteer Assigned',rescue?.assigned_at??donation.claimed_at],['Pickup Started',rescue?.pickup_started_at],['Picked Up',rescue?.picked_up_at],['On the Way',rescue?.delivery_started_at],['Delivered',rescue?.delivered_at],['Completed',rescue?.completed_at]]
  const current=Math.max(0,steps.findIndex(([,timestamp])=>!timestamp))
  return <section className="route-panel" aria-label={`Rescue progress for ${donation.food_name}`}><strong>Rescue progress · {rescue?rescueStage(rescue):donation.status==='available'?'POSTED':'RESERVED'}</strong>
    <ol className="rescue-timeline">{steps.map(([label,timestamp],index)=><li key={label} className={timestamp?'done':index===current?'current':''}><span className="timeline-marker" aria-hidden="true">{timestamp?'✓':''}</span><span className="timeline-copy">{label}<small>{timestamp?<time dateTime={timestamp}>{new Date(timestamp).toLocaleString()}</time>:rescue?.completed_at?'Not recorded in legacy rescue':index===current?'Current stage':'Pending'}</small></span></li>)}</ol>
  </section>
}
