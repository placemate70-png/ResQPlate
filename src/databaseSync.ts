import {donationClient} from './donationService'
type Table='donations'|'rescues'|'ngo_availability'
type Listener={tables:Table[];change:()=>void;status?:(live:boolean)=>void;timer?:ReturnType<typeof setTimeout>}
const listeners=new Set<Listener>()
let channel:ReturnType<ReturnType<typeof donationClient>['channel']>|null=null
let fallback:ReturnType<typeof setInterval>|null=null, live=false
function notify(table?:Table) {
  for(const listener of listeners) if(!table || listener.tables.includes(table)) {
    clearTimeout(listener.timer)
    listener.timer=setTimeout(()=>{if(listeners.has(listener))listener.change()},200)
  }
}
export function watchDatabase(tables:Table[],change:()=>void,status?:(live:boolean)=>void) {
  const listener:Listener={tables,change,status};listeners.add(listener);status?.(live)
  if(!channel) {
    const instance=donationClient().channel(`resqplate-state-${Date.now()}`,{config:{postgres_changes_options:{wait:true}}});channel=instance
    for(const table of ['donations','rescues','ngo_availability'] as Table[]) for(const event of ['INSERT','UPDATE'] as const)
      instance.on('postgres_changes',{event,schema:'public',table},()=>notify(table))
    instance.subscribe(state=>{
      if(channel!==instance) return
      live=state==='SUBSCRIBED'
      for(const entry of listeners) entry.status?.(live)
      if(live) notify()
    })
    fallback=setInterval(()=>{if(!live)notify()},15000)
  }
  return ()=>{
    clearTimeout(listener.timer);listeners.delete(listener)
    if(!listeners.size && channel) {
      const previous=channel;channel=null;live=false
      if(fallback)clearInterval(fallback);fallback=null
      void donationClient().removeChannel(previous)
    }
  }
}
