import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, normalizeStoredSettings } from '../utils/settings'

const SETTINGS_STORAGE_KEY = 'image-grid-combine:settings:v1'

function loadStoredSettings() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS }
  }

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!rawSettings) {
      return { ...DEFAULT_SETTINGS }
    }

    return normalizeStoredSettings(JSON.parse(rawSettings))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function usePersistedSettings() {
  const [settings, setSettings] = useState(loadStoredSettings)

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage failures so the app remains usable.
    }
  }, [settings])

  const handleSettingsChange = useCallback((nextSettings) => {
    setSettings(normalizeStoredSettings(nextSettings))
  }, [])

  const handleSettingInputChange = useCallback((e) => {
    const { name, value, type } = e.target
    const isNumber = type === 'number' || type === 'range'

    setSettings((currentSettings) => normalizeStoredSettings({
      ...currentSettings,
      [name]: isNumber ? Number(value) : value
    }))
  }, [])

  return { settings, handleSettingsChange, handleSettingInputChange }
}
