export interface Bus { id: number; name: string; route_name: string; is_active: boolean; created_at: string }
export interface BusStop { id: number; bus_id: number; stop_name: string; latitude: number; longitude: number; stop_order: number }
export interface BusLocation {
  id?: number; bus_id: number; latitude: number; longitude: number; accuracy: number | null
  speed?: number; sharing: boolean; is_demo: boolean; shared_by: string | null; updated_at: string
}
export type BusStatus = 'live' | 'delayed' | 'offline' | 'disabled'
