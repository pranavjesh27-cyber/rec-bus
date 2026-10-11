import { supabase } from '../lib/supabase'
import type { Bus, BusLocation, BusStop } from '../types'

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

export async function fetchBuses(): Promise<Bus[]> {
  const { data, error } = await supabase.from('buses').select('*').order('id'); fail(error); return data ?? []
}
export async function fetchLocations(): Promise<BusLocation[]> {
  const { data, error } = await supabase.from('bus_locations').select('*'); fail(error); return data ?? []
}
export async function fetchStops(busId: number): Promise<BusStop[]> {
  const { data, error } = await supabase.from('bus_stops').select('*').eq('bus_id', busId).order('stop_order'); fail(error); return data ?? []
}

/** Anonymous per-device ID (stored in localStorage). Used for the one-sharer-per-bus lock. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('bus_tracker_device_id')
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
      localStorage.setItem('bus_tracker_device_id', id)
    }
    return id
  } catch { return 'dev_session_' + Math.random().toString(36).slice(2, 10) }
}

/**
 * Writes the bus's latest position (one row per bus).
 * Live viewers receive it through Supabase Realtime (postgres_changes) - there is no separate,
 * unauthenticated broadcast channel any more, so nobody can fake a location without being an authorized sharer.
 * Errors are NOT swallowed: if RLS rejects the write, the sharer sees why.
 */
export async function pushLocation(busId: number, deviceId: string, lat: number, lng: number, accuracy: number | null, isDemo: boolean) {
  const { error } = await supabase.from('bus_locations').upsert(
    {
      bus_id: busId, latitude: lat, longitude: lng, accuracy,
      shared_by: deviceId, sharing: true, is_demo: isDemo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'bus_id' },
  )
  fail(error)
}

export async function markOffline(busId: number, deviceId: string) {
  const { error } = await supabase.from('bus_locations')
    .update({ sharing: false, shared_by: deviceId, updated_at: new Date().toISOString() })
    .eq('bus_id', busId)
  fail(error)
}
