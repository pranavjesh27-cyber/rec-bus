import { useMemo, useRef } from 'react'
import type { BusLocation, BusStop } from '../types'
import { dist, legMeters, locateOnRoute, ROAD_FACTOR } from '../utils/eta'

export interface StopEta { stop: BusStop; passed: boolean; isNext: boolean; arrival: number | null } // arrival = epoch ms

const DEFAULT_MS = 7 // ~25 km/h until we have real movement to measure

/** Live ETAs: bus position on the route + speed measured from consecutive location updates. */
export function useLiveEta(stops: BusStop[], loc?: BusLocation, active = true) {
  const prev = useRef<{ lat: number; lng: number; t: number } | null>(null)
  const speed = useRef(DEFAULT_MS)
  const maxNext = useRef(0)
  const key = stops.map((s) => s.id).join(',')
  const lastKey = useRef(key)

  return useMemo(() => {
    if (lastKey.current !== key) { lastKey.current = key; prev.current = null; speed.current = DEFAULT_MS; maxNext.current = 0 }
    if (!loc || !active || stops.length < 2) return { etas: [] as StopEta[], speedKmh: 0 }
    const p = { lat: loc.latitude, lng: loc.longitude }, t = new Date(loc.updated_at).getTime()
    if (!loc.is_demo && prev.current && t - prev.current.t >= 2000) {
      const v = dist(prev.current, p) / ((t - prev.current.t) / 1000)
      speed.current = 0.7 * speed.current + 0.3 * Math.max(1.5, Math.min(16.7, v)) // smooth, clamp 5–60 km/h
    }
    if (!prev.current || t - prev.current.t >= 2000) prev.current = { ...p, t }
    if (loc.is_demo) speed.current = DEFAULT_MS

    const pts = stops.map((s) => ({ lat: s.latitude, lng: s.longitude }))
    const found = locateOnRoute(pts, p)
    const next = Math.max(found.next, maxNext.current) // never go backwards
    maxNext.current = next
    const toNext = next === found.next ? found.meters : next < stops.length ? dist(p, pts[next]) : 0

    const etas = stops.map((stop, j) => {
      if (j < next) return { stop, passed: true, isNext: false, arrival: null }
      const meters = (toNext + legMeters(stops, next, j)) * ROAD_FACTOR
      return { stop, passed: false, isNext: j === next, arrival: t + (meters / speed.current) * 1000 }
    })
    return { etas, speedKmh: Math.round(speed.current * 3.6) }
  }, [loc?.updated_at, loc?.latitude, loc?.longitude, key, active])
}
