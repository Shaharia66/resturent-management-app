import React, { useState } from 'react'
import client, { API_URL } from '../../api/client'
import { useSettings } from '../../context/SettingsContext'

export default function AdminSiteSettings() {
  const { settings, refreshSettings } = useSettings()
  const [form, setForm] = useState({
    restaurant_name: settings.restaurant_name,
    logo_initials: settings.logo_initials,
    hero_heading: settings.hero_heading,
    hero_subheading: settings.hero_subheading,
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await client.put('/api/admin/settings', form)
      refreshSettings()
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (slot, file) => {
    if (!file) return
    setUploading(slot)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      await client.post(`/api/admin/settings/upload-photo?slot=${slot}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      refreshSettings()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not upload photo.')
    } finally {
      setUploading(null)
    }
  }

  const imageSrc = (path) => (path ? `${API_URL}${path}` : null)

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-2">Site Settings</h1>
      <p className="text-sm text-olive-600 mb-6">
        Change your restaurant's name, logo initials, and homepage hero content.
      </p>

      {error && (
        <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-olive-100 rounded-2xl p-5 space-y-4 mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-olive-800">Restaurant name</label>
            <input
              value={form.restaurant_name}
              onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive-800">Logo initials</label>
            <input
              value={form.logo_initials}
              maxLength={6}
              onChange={(e) => setForm({ ...form, logo_initials: e.target.value })}
              className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-olive-500 mt-1">Shown in the circular badge next to the name.</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-olive-800">Homepage headline</label>
          <textarea
            rows={2}
            value={form.hero_heading}
            onChange={(e) => setForm({ ...form, hero_heading: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-olive-800">Homepage subtext</label>
          <textarea
            rows={3}
            value={form.hero_subheading}
            onChange={(e) => setForm({ ...form, hero_subheading: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {savedMsg && <span className="text-sm text-olive-600">{savedMsg}</span>}
        </div>
      </form>

      <h2 className="text-lg font-display font-semibold mb-3">Homepage photos</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {['hero_image_1', 'hero_image_2'].map((slot, idx) => {
          const currentUrl = idx === 0 ? settings.hero_image_1_url : settings.hero_image_2_url
          return (
            <div key={slot} className="bg-white border border-olive-100 rounded-2xl p-4">
              <p className="text-sm font-medium text-olive-800 mb-2">Photo {idx + 1}</p>
              <div className="h-40 rounded-xl overflow-hidden bg-olive-100 mb-3">
                {currentUrl ? (
                  <img src={imageSrc(currentUrl)} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-olive-400 text-sm">
                    No photo uploaded
                  </div>
                )}
              </div>
              <label className="block">
                <span className="text-sm px-4 py-2 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100 cursor-pointer inline-block">
                  {uploading === slot ? 'Uploading...' : 'Upload photo'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading === slot}
                  onChange={(e) => handleUpload(slot, e.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-olive-500 mt-2">JPG, PNG, WEBP, or GIF. Max 5MB.</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}