import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BusMap from '../components/BusMap'
import StatusBadge from '../components/StatusBadge'
import { useBuses } from '../hooks/useBuses'
import { useLiveEta } from '../hooks/useLiveEta'
import { fetchStops } from '../services/api'
import type { BusStop } from '../types'
import { formatEta } from '../utils/eta'
import { getStatus, timeAgo } from '../utils/status'

export default function Track() {
  const id = Number(useParams().busId)
  const { buses, locations, error, loading, now } = useBuses()
  const [stops, setStops] = useState<BusStop[]>([])
  const bus = buses.find((b) => b.id === id)
  const loc = locations[id]

  useEffect(() => { fetchStops(id).then(setStops).catch(() => {}) }, [id])

  const status = bus ? getStatus(bus, loc, now) : 'offline'
  const showPos = !!loc && status !== 'offline' && status !== 'disabled'
  const { etas, speedKmh } = useLiveEta(stops, loc, showPos)

  if (!loading && !bus) return <main className="p-6">Bus not found. <Link className="text-violet-700 underline" to="/buses">Back to buses</Link></main>

  return (
    <div className="flex h-[calc(100dvh-52px)] flex-col">
      <div className="relative min-h-0 flex-1">
        <BusMap stops={stops} busName={bus?.name ?? 'Bus'} lat={showPos && loc ? loc.latitude : null} lng={showPos && loc ? loc.longitude : null} />
        {loc?.is_demo && showPos && <span className="absolute left-3 top-3 z-[1000] rounded-full bg-purple-600 px-3 py-1 text-sm font-bold text-white shadow">DEMO MODE · simulated location</span>}
      </div>
      <section className="max-h-[48%] space-y-1 overflow-y-auto rounded-t-3xl bg-white p-4 shadow-[0_-4px_16px_#0002]">
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{bus?.name}</h1>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-slate-600">Last updated: {timeAgo(loc?.updated_at, now)}{showPos ? ` · speed ≈ ${speedKmh} km/h` : ''}</p>
        <p className="text-sm text-slate-600">Coordinates: {loc ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}` : 'not available yet'}</p>

        <h2 className="pt-2 font-semibold">Live stop timings</h2>
        {!showPos && (
          <div className="pt-1">
            <p className="text-sm text-slate-500">Live timings appear when someone on the bus is sharing location.</p>
            <Link to={`/share?bus=${id}`} className="mt-2 inline-block rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              📡 Are you on this bus? Share Live Location
            </Link>
          </div>
        )}
        <ul className="space-y-1">
          {etas.map((e) => (
            <li key={e.stop.id} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${e.isNext ? 'bg-violet-100 font-semibold text-violet-900' : e.passed ? 'text-slate-400' : ''}`}>
              <span>{e.passed ? '✓ ' : e.isNext ? '🚌 ' : ''}{e.stop.stop_name}</span>
              <span className="whitespace-nowrap">
                {e.passed || e.arrival == null ? 'Passed' : `${formatEta((e.arrival - now) / 1000)} · ${new Date(e.arrival).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
              </span>
            </li>
          ))}
        </ul>
        {etas.length > 0 && <p className="pt-1 text-xs text-slate-500">Estimated from the bus's live position and speed. Traffic can change it.</p>}
      </section>
    </div>
  )
}
