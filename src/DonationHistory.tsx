import { DonationDetails } from './DonationDetails'
import { useDonations } from './useDonations'
import { EmptyState, Icon, LoadingState, PageHeading } from './UI'
import { useRescues } from './useRescues'
import { RescueTimeline } from './RescueTimeline'

export function DonationHistory({ userId }: { userId: string }) {
  const state = useDonations(userId)
  const progress=useRescues()
  return <section><PageHeading title="Your donation history" eyebrow="Every meal has a story" description="Your shared food, freshness windows, and claim status in one place."
    action={<a className="button-link" href="/donor/new"><Icon name="plus" />Create donation</a>} />
    {state.loading ? <LoadingState label="Loading history…" /> : state.error ? <p role="alert">{state.error}</p>
      : !state.donations.length ? <EmptyState title="Your story is just getting started" description="Once you share a donation, its details and status will stay here for you to follow." action={<a className="button-link" href="/donor/new">Create your first donation</a>} />
      : <div className="donation-grid">{state.donations.map(row => <div className="donation-card" key={row.id}>
        <DonationDetails donation={row} editable />
        {progress.loading?<LoadingState label="Loading rescue progress…"/>:progress.error?<p role="alert">{progress.error}</p>:<RescueTimeline donation={row} rescue={progress.rescues.find(r=>r.donation_id===row.id)}/>}
        <div className="card-actions"><a href={`/donor/new?donation=${row.id}`}>View donation / attach image <Icon name="arrow" /></a></div>
      </div>)}</div>}
  </section>
}
