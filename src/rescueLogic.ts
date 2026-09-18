import type { Rescue } from './rescueService'

export function rescueStage(rescue: Rescue) {
  if (rescue.completed_at) return 'COMPLETED'
  if (rescue.delivered_at) return 'DELIVERED'
  if (rescue.delivery_started_at) return 'ON THE WAY'
  if (rescue.picked_up_at) return 'PICKED UP'
  if (rescue.pickup_started_at) return 'PICKUP IN PROGRESS'
  return 'RESERVED'
}

export function nextRescueAction(rescue: Rescue) {
  if (rescue.completed_at || rescue.delivered_at) return null
  if (rescue.delivery_started_at) return { action: 'deliver' as const, label: 'Mark Delivered' }
  if (rescue.picked_up_at) return { action: 'start_delivery' as const, label: 'Start Delivery' }
  if (rescue.pickup_started_at) return { action: 'pickup' as const, label: 'Mark Picked Up' }
  return { action: 'start_pickup' as const, label: 'Start Pickup' }
}
