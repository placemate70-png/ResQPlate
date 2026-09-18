import {useGrabBoard} from './useGrabBoard'
import {RescuePanel} from './RescuePanel'
import {LoadingState,PageHeading} from './UI'
export function ActiveRescue({userId}:{userId:string}) {
  const state=useGrabBoard(userId)
  const selected=new URLSearchParams(window.location.search).get('rescue')
  return <section><PageHeading title="Active Rescue" eyebrow="From pickup to receipt" description="Confirm real progress. Location and routing assist you; NGO receipt completes the rescue." action={<a className="button-link button-secondary" href="/volunteer/grabboard">Back to GrabBoard</a>}/>
    {state.loading?<LoadingState label="Loading active rescue…"/>:state.error?<p role="alert">{state.error}</p>:selected && !state.reservations.some(d=>d.id===selected)?<p role="alert">Rescue unavailable. Select one of your own confirmed claims.</p>:<RescuePanel userId={userId} role="volunteer" donations={state.reservations} focusId={selected??undefined}/>}
  </section>
}
