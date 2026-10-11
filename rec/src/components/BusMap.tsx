import { memo, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BusStop } from '../types'

const pin = (html: string, cls: string, size: number) =>
  L.divIcon({ html, className: cls, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

interface Props {
  stops: BusStop[]
  /** Pass primitives (not a new object each render) so the map is not touched needlessly. */
  lat?: number | null
  lng?: number | null
  busName: string
}

/**
 * Three separate effects, each with its own narrow dependencies:
 *  1. create the map once (and fix its size when the container resizes)
 *  2. draw route + stop pins ONLY when `stops` changes
 *  3. move the bus marker ONLY when lat/lng changes (setLatLng, never re-create)
 * This is what removes the flicker: previously everything was cleared and redrawn every second.
 */
function BusMap({ stops, lat, lng, busName }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const routeLayer = useRef<L.LayerGroup | null>(null)
  const bus = useRef<L.Marker | null>(null)
  const fittedStops = useRef(false)
  const centeredOnBus = useRef(false)

  // 1. Create the map once
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: true }).setView([12.95, 80.15], 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m)
    routeLayer.current = L.layerGroup().addTo(m)
    map.current = m

    // Grey/blank map fix: Leaflet must be told when its container size changes (flex layouts, mobile address bar, etc.)
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    const t = setTimeout(() => m.invalidateSize(), 200)

    return () => {
      clearTimeout(t); ro.disconnect(); m.remove()
      map.current = null; routeLayer.current = null; bus.current = null
      fittedStops.current = false; centeredOnBus.current = false
    }
  }, [])

  // 2. Route line + numbered stops (only when the stops change)
  useEffect(() => {
    const m = map.current, g = routeLayer.current
    if (!m || !g) return
    g.clearLayers()
    const sorted = [...stops].sort((a, b) => a.stop_order - b.stop_order)
    const pts = sorted.map((s) => [s.latitude, s.longitude] as [number, number])
    if (pts.length > 1) L.polyline(pts, { color: '#7C3AED', weight: 4, dashArray: '8 8' }).addTo(g)
    sorted.forEach((s) =>
      L.marker([s.latitude, s.longitude], { icon: pin(String(s.stop_order), 'stop-pin', 28) })
        .bindPopup(s.stop_name)
        .addTo(g),
    )
    if (pts.length && !fittedStops.current && !centeredOnBus.current) {
      m.fitBounds(L.latLngBounds(pts), { padding: [40, 40] })
      fittedStops.current = true
    }
  }, [stops])

  // 3. Bus marker (create once, then just move it)
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (lat == null || lng == null) {
      if (bus.current) { bus.current.remove(); bus.current = null }
      return
    }
    const ll: L.LatLngExpression = [lat, lng]
    if (!bus.current) {
      bus.current = L.marker(ll, { icon: pin('🚌', 'bus-pin', 40), zIndexOffset: 1000 })
        .bindTooltip(busName, { permanent: true, direction: 'top', offset: [0, -22] })
        .addTo(m)
      if (!centeredOnBus.current) { m.setView(ll, 15); centeredOnBus.current = true }
    } else {
      bus.current.setLatLng(ll)
      if (!m.getBounds().contains(ll)) m.panTo(ll, { animate: true })
    }
  }, [lat, lng, busName])

  return <div ref={el} className="h-full w-full" style={{ minHeight: 240 }} />
}

export default memo(BusMap)
