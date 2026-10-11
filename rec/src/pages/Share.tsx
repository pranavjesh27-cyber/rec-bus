import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBuses } from '../hooks/useBuses'
import { fetchStops, getDeviceId, markOffline, pushLocation } from '../services/api'
import { startWatching } from '../services/geolocation'
import { buildDemoPath } from '../utils/demo'
import { ageSeconds } from '../utils/status'

type Mode = 'real' | 'demo'
const HEARTBEAT_MS = 15000 // re-send last position while stationary so the bus doesn't look "offline"

export default function Share() {
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('bus') ? Number(searchParams.get('bus')) : ''
  const { buses, locations, now } = useBuses()
  const [busId, setBusId] = useState<number | ''>(preselected)
  const [mode, setMode] = useState<Mode | null>(null) // null = not sharing
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [perm, setPerm] = useState('Not requested')
  const stopFn = useRef<(() => void) | null>(null)
  const activeBus = useRef<number | null>(null)
  const deviceId = useRef(getDeviceId())
  const lastFix = useRef<{ lat: number; lng: number; acc: number | null; demo: boolean } | null>(null)
  const lastSent = useRef(0)
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const bus = buses.find((b) => b.id === busId)
  const active = buses.filter((b) => b.is_active)
  const loc = busId !== '' ? locations[busId] : undefined

  const isLockedBy = (l?: typeof loc) =>
    Boolean(l && l.sharing && ageSeconds(l.updated_at, now) < 60 && l.shared_by && l.shared_by !== deviceId.current)
  const isLockedByOther = busId !== '' && isLockedBy(loc)
  const lockAgeSec = loc ? Math.floor(ageSeconds(loc.updated_at, now)) : 0

  useEffect(() => () => { stop() }, []) // stop sharing when leaving the page

  async function keepScreenOn() {
    try { wakeLock.current = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* not supported / denied */ }
  }
  useEffect(() => {
    const again = () => { if (document.visibilityState === 'visible' && activeBus.current != null) keepScreenOn() }
    document.addEventListener('visibilitychange', again)
    return () => document.removeEventListener('visibilitychange', again)
  }, [])

  async function send(lat: number, lng: number, acc: number | null, demo: boolean) {
    if (activeBus.current == null) return
    lastFix.current = { lat, lng, acc, demo }
    try {
      await pushLocation(activeBus.current, deviceId.current, lat, lng, acc, demo)
      lastSent.current = Date.now()
      setPos({ lat, lng }); setSentAt(Date.now())
      setError((e) => (e && e.startsWith('Could not send') ? null : e))
    } catch (e) {
      setError(`Could not send location: ${e instanceof Error ? e.message : 'check your connection'}`)
    }
  }

  function startReal() {
    if (busId === '' || isLockedByOther) return
    setError(null); activeBus.current = busId; setMode('real'); keepScreenOn()
    let last = 0
    const stopWatch = startWatching(
      (p) => {
        setPerm('Granted')
        if (Date.now() - last < 2500) return // throttle writes to one per 2.5 s
        last = Date.now()
        send(p.coords.latitude, p.coords.longitude, p.coords.accuracy, false)
      },
      (msg) => { setError(msg); if (msg.includes('denied')) { setPerm('Denied'); stop() } },
    )
    const beat = setInterval(() => {
      const f = lastFix.current
      if (f && Date.now() - lastSent.current > HEARTBEAT_MS - 1000) send(f.lat, f.lng, f.acc, f.demo)
    }, HEARTBEAT_MS)
    stopFn.current = () => { stopWatch(); clearInterval(beat) }
  }

  async function startDemo() {
    if (busId === '' || isLockedByOther) return
    setError(null)
    const stops = await fetchStops(busId)
    if (stops.length < 2) { setError('Demo mode needs at least 2 stops for this bus.'); return }
    const path = buildDemoPath(stops); let i = 0
    activeBus.current = busId; setMode('demo')
    const t = setInterval(() => { const p = path[Math.min(i++, path.length - 1)]; send(p.lat, p.lng, null, true); if (i >= path.length) i = path.length - 1 }, 1800)
    stopFn.current = () => clearInterval(t)
  }

  function stop() {
    stopFn.current?.(); stopFn.current = null
    wakeLock.current?.release().catch(() => {}); wakeLock.current = null
    const id = activeBus.current; activeBus.current = null; lastFix.current = null
    setMode(null)
    if (id != null) markOffline(id, deviceId.current).catch(() => {})
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-violet-900">Share Bus Location</h1>
      <p className="text-sm text-slate-600">No login needed. Anyone on the bus can share live location. Only one person can broadcast a bus at a time.</p>

      {!mode && (
        <div className="card space-y-3">
          <label className="text-sm font-medium">Select Bus</label>
          <select className="input" value={busId} onChange={(e) => setBusId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Choose a bus…</option>
            {active.map((b) => (
              <option key={b.id} value={b.id}>{b.name} {isLockedBy(locations[b.id]) ? '🔒 (In Use)' : '🟢 (Available)'}</option>
            ))}
          </select>

          {bus && isLockedByOther && (
            <div className="space-y-2 rounded-xl border-2 border-red-300 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-bold text-red-800">Bus is Currently in Use</h3>
                  <p className="text-xs text-red-700">Another person is actively sharing live location for this bus.</p>
                </div>
              </div>
              <p className="text-xs text-red-600">Last update received {lockAgeSec}s ago. The lock releases automatically if they stop or lose connection for 60 seconds.</p>
              <Link to={`/track/${bus.id}`} className="btn btn-primary mt-2 block w-full text-center">📍 Track This Bus on Live Map</Link>
            </div>
          )}

          {bus && !isLockedByOther && (
            <div className="rounded-xl border-2 border-green-300 bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-800">🟢 Available to Share</p>
              <p className="text-xs text-green-700">No one is currently broadcasting this bus. You can start sharing!</p>
            </div>
          )}

          <p className="text-sm text-slate-600">Location Permission: <b>{perm}</b></p>
          <button className="btn btn-primary w-full" disabled={busId === '' || isLockedByOther} onClick={startReal}>
            {isLockedByOther ? 'Sharing Locked (Bus in Use)' : 'Start Sharing Location'}
          </button>
          <button className="btn btn-ghost w-full" disabled={busId === '' || isLockedByOther} onClick={startDemo}>
            Start Demo (simulated route, no GPS)
          </button>
        </div>
      )}

      {mode && (
        <div className={`card space-y-2 ${mode === 'demo' ? 'border-purple-400' : 'border-green-400'}`}>
          {mode === 'demo' && <p className="rounded bg-purple-600 px-3 py-1 text-center text-sm font-bold text-white">DEMO MODE · simulated location</p>}
          <p className="text-lg font-bold">{mode === 'demo' ? '🟣 SIMULATION ACTIVE' : '🟢 LOCATION SHARING ACTIVE'}</p>
          <p>Bus: <b>{bus?.name}</b></p>
          <p>Latitude: <b>{pos ? pos.lat.toFixed(6) : 'waiting for GPS…'}</b></p>
          <p>Longitude: <b>{pos ? pos.lng.toFixed(6) : 'waiting for GPS…'}</b></p>
          <p className="text-sm text-slate-600">Last sent: {sentAt ? `${Math.floor((now - sentAt) / 1000)} s ago` : '—'}</p>
          <p className="text-xs text-slate-500">Keep this page open. Your screen is kept awake while sharing (if your browser supports it).</p>
          <button className="btn btn-danger w-full" onClick={stop}>Stop Sharing</button>
          <Link to={`/track/${bus?.id}`} className="btn btn-ghost block w-full text-center">Open Live Map View</Link>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p className="text-xs text-slate-500">Your location is shared only while sharing is active. Press Stop Sharing at any time to release the bus.</p>
    </main>
  )
}
