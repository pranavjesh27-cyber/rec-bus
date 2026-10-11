import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchBuses, fetchLocations } from '../services/api'
import type { Bus, BusLocation } from '../types'

/** Keep whichever row is newer, so a late/out-of-order message never moves a bus backwards. */
const newer = (a: BusLocation | undefined, b: BusLocation) =>
  !a || new Date(b.updated_at).getTime() >= new Date(a.updated_at).getTime() ? b : a

/** Buses + latest locations. Locations update live through Supabase Realtime (no page refresh). */
export function useBuses() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [locations, setLocations] = useState<Record<number, BusLocation>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const reload = useCallback(() => fetchBuses().then(setBuses).catch((e) => setError(e.message)), [])

  const reloadLocations = useCallback(
    () => fetchLocations()
      .then((rows) => setLocations(Object.fromEntries(rows.map((r) => [r.bus_id, r]))))
      .catch((e) => setError(e.message)),
    [],
  )

  useEffect(() => {
    reload().finally(() => setLoading(false))
    reloadLocations()

    // Unique channel name per hook instance: avoids clashes with React StrictMode's double-mount and other pages.
    const channel = supabase
      .channel(`bus-live-${Math.random().toString(36).slice(2, 10)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as Partial<BusLocation>
          if (old.bus_id != null) setLocations((prev) => { const next = { ...prev }; delete next[old.bus_id as number]; return next })
          return
        }
        const row = payload.new as BusLocation
        setLocations((prev) => ({ ...prev, [row.bus_id]: newer(prev[row.bus_id], row) }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, () => { reload() })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setError(null)
          reloadLocations() // catch anything missed while (re)connecting
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setError('Live connection lost. Reconnecting…')
      })

    // After the phone sleeps / the tab was in the background, re-sync immediately.
    const onVisible = () => { if (document.visibilityState === 'visible') { reloadLocations(); reload() } }
    document.addEventListener('visibilitychange', onVisible)

    const tick = setInterval(() => setNow(Date.now()), 1000) // re-evaluate "x seconds ago" and offline status
    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(tick)
    }
  }, [reload, reloadLocations])

  return { buses, locations, error, loading, now, reload }
}
