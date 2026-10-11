import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { isConfigured } from '../lib/supabase'

export default function Layout() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between bg-violet-700 px-4 py-3 text-white">
        <Link to="/" className="text-lg font-bold">🚌 College Bus Live</Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/buses">Buses</Link>
          <Link to="/share">Share Location</Link>
        </nav>
      </header>
      {!online && <div className="bg-red-600 px-4 py-2 text-center text-sm text-white">You are offline. Reconnect to the internet to see live updates.</div>}
      {!isConfigured && <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and add your project URL and anon key, then restart <code>npm run dev</code>.</div>}
      <Outlet />
    </div>
  )
}
