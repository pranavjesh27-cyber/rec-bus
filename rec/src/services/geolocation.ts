export function geoErrorMessage(e: GeolocationPositionError): string {
  if (e.code === e.PERMISSION_DENIED) return 'Location permission was denied. Please allow location access in your browser settings.'
  if (e.code === e.POSITION_UNAVAILABLE) return 'GPS is unavailable right now. Check that device location is turned on.'
  return 'Getting your location timed out. Move to an open area and try again.'
}

/** Starts watching GPS. Must only be called from a user click. Returns a stop function. */
export function startWatching(onPos: (p: GeolocationPosition) => void, onError: (msg: string) => void): () => void {
  if (!('geolocation' in navigator)) {
    onError('This browser does not support GPS location.')
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(onPos, (e) => onError(geoErrorMessage(e)), {
    enableHighAccuracy: true, maximumAge: 2000, timeout: 20000,
  })
  return () => navigator.geolocation.clearWatch(id)
}
