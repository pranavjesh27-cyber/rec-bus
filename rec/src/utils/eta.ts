import type { BusStop } from '../types'

export interface LatLng { lat: number; lng: number }
export const ROAD_FACTOR = 1.3 // roads are longer than the straight line between stops

/** Straight-line distance in metres. */
export function dist(a: LatLng, b: LatLng): number {
  const R = 6371000, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Metres along the stop-to-stop legs from stop index `from` to stop index `to`. */
export function legMeters(stops: BusStop[], from: number, to: number): number {
  let m = 0
  for (let i = from; i < to; i++) m += dist({ lat: stops[i].latitude, lng: stops[i].longitude }, { lat: stops[i + 1].latitude, lng: stops[i + 1].longitude })
  return m
}

/** Finds which stop the bus is heading to next, and the metres from the bus to it. */
export function locateOnRoute(pts: LatLng[], p: LatLng): { next: number; meters: number } {
  const at = pts.findIndex((q) => dist(p, q) < 60)
  if (at >= 0) return { next: at, meters: dist(p, pts[at]) }
  const k = Math.cos(p.lat * Math.PI / 180)
  let bestSeg = 0, bestT = 0, bestD = Infinity
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = (pts[i].lng - p.lng) * k, ay = pts[i].lat - p.lat
    const bx = (pts[i + 1].lng - p.lng) * k, by = pts[i + 1].lat - p.lat
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy
    const t = len ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len)) : 0
    const d = Math.hypot(ax + dx * t, ay + dy * t)
    if (d < bestD) { bestD = d; bestSeg = i; bestT = t }
  }
  const next = bestSeg === 0 && bestT === 0 ? 0 : bestSeg + 1 // before the first stop => heading to stop 1
  return { next, meters: dist(p, pts[next]) }
}

export function formatEta(sec: number): string {
  if (sec < 60) return 'Arriving now'
  const m = Math.round(sec / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
}
