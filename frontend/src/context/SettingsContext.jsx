import React, { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client'

const SettingsContext = createContext(null)

const DEFAULTS = {
  restaurant_name: 'Olive & Ember',
  logo_initials: 'O&E',
  hero_heading: "Slow-cooked flavor,\nserved without delay.",
  hero_subheading:
    "Browse today's menu, see what fellow diners rated highest, and let our AI concierge help you pick your next favorite dish.",
  hero_image_1_url: null,
  hero_image_2_url: null,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  const refreshSettings = () => {
    client
      .get('/api/settings')
      .then((res) => setSettings({ ...DEFAULTS, ...res.data }))
      .catch(() => setSettings(DEFAULTS))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refreshSettings() }, [])

  useEffect(() => {
    if (settings.restaurant_name) {
      document.title = settings.restaurant_name
    }
  }, [settings.restaurant_name])

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}