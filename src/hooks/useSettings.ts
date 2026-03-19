import { useCallback, useEffect, useState } from 'react'
import { getSettings, updateSettings, type SettingsMap } from '../api/settings'

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSettings = useCallback(async () => {
    setLoading(true)

    try {
      const result = await getSettings()
      setSettings(result)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSettings()
  }, [refreshSettings])

  const saveSettings = useCallback(async (data: SettingsMap) => {
    await updateSettings(data)
    setSettings((currentSettings) => ({
      ...currentSettings,
      ...data,
    }))
  }, [])

  return {
    settings,
    loading,
    error,
    refreshSettings,
    saveSettings,
  }
}
