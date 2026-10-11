import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { useBuses } from '../hooks/useBuses'
import { getStatus, timeAgo } from '../utils/status'

export default function BusList() {
  const { buses, locations, error, loading, now } = useBuses()
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-3 px-4 py-6">
      <h1 className="text-2xl font-bold text-violet-900">Available buses</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Could not reach the server: {error}</p>}
      {loading && <p className="text-slate-500">Loading buses…</p>}
      {!loading && !buses.length && !error && <p className="text-slate-500">No buses yet. Add buses in the Supabase Table Editor (see README).</p>}
      {buses.map((b) => {
        const loc = locations[b.id]
        return (
          <div key={b.id} className="card flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{b.name}</h2>
              <p className="text-sm text-slate-600">Route: {b.route_name}</p>
              <div className="mt-2"><StatusBadge status={getStatus(b, loc, now)} /></div>
              <p className="mt-1 text-xs text-slate-500">Last updated: {timeAgo(loc?.updated_at, now)}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link to={`/track/${b.id}`} className="btn btn-primary">Track Bus</Link>
              {(!loc || !loc.sharing) && (
                <Link to={`/share?bus=${b.id}`} className="btn btn-ghost text-xs py-1">Share</Link>
              )}
            </div>
          </div>
        )
      })}
    </main>
  )
}
