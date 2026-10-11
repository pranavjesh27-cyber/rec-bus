import type { BusStop } from '../types'

/** Interpolates points along the ordered stops so the demo bus glides between them. */
export function buildDemoPath(stops: BusStop[], stepsPerLeg = 25): { lat: number; lng: number }[] {
  const s = [...stops].sort((a, b) => a.stop_order - b.stop_order)
  const pts: { lat: number; lng: number }[] = []
  for (let i = 0; i < s.length - 1; i++) {
    for (let k = 0; k < stepsPerLeg; k++) {
      const t = k / stepsPerLeg
      pts.push({
        lat: s[i].latitude + (s[i + 1].latitude - s[i].latitude) * t,
        lng: s[i].longitude + (s[i + 1].longitude - s[i].longitude) * t,
      })
    }
  }
  if (s.length) pts.push({ lat: s[s.length - 1].latitude, lng: s[s.length - 1].longitude })
  return pts
}
