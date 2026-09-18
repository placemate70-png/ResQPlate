import type {Donation} from './donationService'
import type {Rescue} from './rescueService'
import {impactTotals} from './impactLogic'
import {LoadingState,Stat} from './UI'
export function ImpactStats({donations,rescues,role,loading,error}:{donations:Donation[];rescues:Rescue[];role:'donor'|'volunteer'|'ngo';loading:boolean;error:string}) {
  if(loading)return <LoadingState label="Loading completed-rescue impact…"/>
  if(error)return <p role="alert">{error}</p>
  const totals=impactTotals(donations,rescues)
  return <div className="stats-grid impact-stats"><Stat label="Completed Rescues" value={totals.count} icon="check" detail="Confirmed by the receiving NGO"/>
    <Stat label={role==='donor'?'Plates Served':role==='ngo'?'Plates Received':'Plates Delivered'} value={totals.plates} icon="plate" detail="Actual received plates from completed rescues"/>
    <Stat label={role==='donor'?'Food Donated':role==='ngo'?'Food Received':'Food Rescued'} value={totals.food} icon="food" detail="Recorded quantities; completed rescues only"/></div>
}
