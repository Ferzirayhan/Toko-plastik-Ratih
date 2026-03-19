import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface UseSupabaseRealtimeOptions {
  table: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  schema?: string
  enabled?: boolean
  onChange: () => void | Promise<void>
}

export function useSupabaseRealtime({
  table,
  event = '*',
  schema = 'public',
  enabled = true,
  onChange,
}: UseSupabaseRealtimeOptions) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const channel = supabase
      .channel(`realtime-${schema}-${table}`)
      .on('postgres_changes', { event, schema, table }, () => {
        void onChange()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, event, onChange, schema, table])
}
