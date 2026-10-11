import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)
// Placeholders keep the app from crashing before .env is filled in; the UI shows a setup notice instead.
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, // no login system
})
