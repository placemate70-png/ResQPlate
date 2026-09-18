import type { ReactNode } from 'react'

type IconName = 'plate' | 'grid' | 'plus' | 'history' | 'arrow' | 'clock' | 'route' | 'check' | 'food' | 'image'
const paths: Record<IconName, string> = {
  plate: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M16 3v5m4-5v5m-4-2h4m-2 2v6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  plus: 'M12 5v14M5 12h14', history: 'M3 12a9 9 0 1 0 3-6M3 3v6h6M12 7v5l3 2',
  arrow: 'M5 12h14M14 7l5 5-5 5', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2',
  route: 'M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M19 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4M5 7v6a3 3 0 0 0 3 3h8a3 3 0 0 0 0-6h-5M19 17v-1',
  check: 'M5 12l4 4L19 6', food: 'M4 12h16a8 8 0 0 1-16 0M3 21h18M8 3v4M12 2v5M16 3v4',
  image: 'M3 3h18v18H3zM3 16l5-5 5 5 3-3 5 5M16 7h.01',
}
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
export function Brand() {
  return <a href="/dashboard" className="brand" aria-label="ResQPlate home"><span className="brand-mark"><Icon name="plate" /></span><span>ResQ<span className="brand-light">Plate</span><span className="brand-dot">.</span></span></a>
}
export function PageHeading({ title, description, eyebrow = 'Food rescue, made simple', action }: { title: string; description: string; eyebrow?: string; action?: ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-description">{description}</p></div>{action && <div className="heading-actions">{action}</div>}</header>
}
export function Stat({ label, value, icon, detail }: { label: string; value: number; icon: IconName; detail: string }) {
  return <div className="stat"><div className="stat-top"><span>{label}</span><Icon name={icon} /></div><strong>{value}</strong><p>{detail}</p></div>
}
export function LoadingState({ label }: { label: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}<div className="skeleton-lines" aria-hidden="true"><span /><span /><span /></div></div>
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="food" /></span><h3>{title}</h3><p>{description}</p>{action}</div>
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}><span className="status-dot" />{status}</span>
}
