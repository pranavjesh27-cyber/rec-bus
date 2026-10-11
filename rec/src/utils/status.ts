import type { Bus, BusLocation, BusStatus } from '../types'

export function ageSeconds(iso?: string, now = Date.now()) {
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000)) : Infinity
}
export function timeAgo(iso?: string, now = Date.now()) {
  const s = ageSeconds(iso, now)
  if (s === Infinity) return 'never'
  if (s < 5) return 'just now'
  if (s < 60) return `${s} seconds ago`
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  return `${Math.floor(s / 3600)} h ago`
}
// >60s without update: may be unavailable. >5 min (or sharing stopped): offline.
export function getStatus(bus: Bus, loc?: BusLocation, now = Date.now()): BusStatus {
  if (!bus.is_active) return 'disabled'
  if (!loc || !loc.sharing) return 'offline'
  const s = ageSeconds(loc.updated_at, now)
  return s > 300 ? 'offline' : s > 60 ? 'delayed' : 'live'
}
export const STATUS_UI: Record<BusStatus, { label: string; cls: string }> = {
  live: { label: '🟢 Live', cls: 'bg-green-100 text-green-800' },
  delayed: { label: '🟠 Location may be unavailable', cls: 'bg-orange-100 text-orange-800' },
  offline: { label: '⚪ Bus Offline', cls: 'bg-slate-100 text-slate-600' },
  disabled: { label: '⛔ Disabled', cls: 'bg-red-100 text-red-700' },
}
