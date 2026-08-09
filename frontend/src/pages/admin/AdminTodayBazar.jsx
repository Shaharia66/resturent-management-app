import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm = {
  mode: 'existing',
  bazar_item_id: '',
  new_item_name: '',
  new_item_unit: 'g',
  new_item_reorder_threshold: 100,
  quantity_purchased: '',
  purchase_date: todayStr(),
  notes: '',
}

export default function AdminTodayBazar() {
  const navigate = useNavigate()
  const [bazarItems, setBazarItems] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      client.get('/api/admin/bazar-items'),
      client.get('/api/admin/today-bazar', { params: { entry_date: todayStr() } }),
    ])
      .then(([bazarRes, entriesRes]) => {
        setBazarItems(bazarRes.data)
        setEntries(entriesRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.quantity_purchased || parseFloat(form.quantity_purchased) <= 0) {
      setError('Enter a quantity purchased.')
      return
    }
    const payload = {
      quantity_purchased: parseFloat(form.quantity_purchased),
      purchase_date: form.purchase_date,
      notes: form.notes || null,
    }
    if (form.mode === 'existing') {
      if (!form.bazar_item_id) {
        setError('Select an ingredient.')
        return
      }
      payload.bazar_item_id = parseInt(form.bazar_item_id)
    } else {
      if (!form.new_item_name.trim()) {
        setError('Enter the new ingredient name.')
        return
      }
      payload.new_item_name = form.new_item_name.trim()
      payload.new_item_unit = form.new_item_unit
      payload.new_item_reorder_threshold = parseFloat(form.new_item_reorder_threshold) || 0
    }

    setSaving(true)
    try {
      await client.post('/api/admin/today-bazar', payload)
      setForm({ ...emptyForm, purchase_date: form.purchase_date })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save this entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleUndo = async (entry) => {
    if (!window.confirm(`Undo this entry? This will subtract ${entry.quantity_purchased} ${entry.unit} of ${entry.bazar_item_name} back out of the Bazar List.`)) return
    await client.delete(`/api/admin/today-bazar/${entry.id}`)
    load()
  }

  if (loading) return <LoadingSpinner />

  const shoppingList = bazarItems.filter((b) => b.needs_restock)

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-2">Today's Bazar</h1>
      <p className="text-sm text-olive-600 mb-6">
        Log what you bought today — it's added straight into the Bazar List automatically.
      </p>

      {error && (
        <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-olive-100 rounded-2xl p-5 mb-8">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setForm({ ...form, mode: 'existing' })}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              form.mode === 'existing' ? 'bg-paprika-500 border-paprika-500 text-ivory' : 'border-olive-300 text-olive-700'
            }`}
          >
            Existing ingredient
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, mode: 'new' })}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              form.mode === 'new' ? 'bg-paprika-500 border-paprika-500 text-ivory' : 'border-olive-300 text-olive-700'
            }`}
          >
            New ingredient
          </button>
        </div>

        {form.mode === 'existing' ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-olive-800">Ingredient</label>
              <select
                value={form.bazar_item_id}
                onChange={(e) => setForm({ ...form, bazar_item_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                {bazarItems.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} — currently {b.quantity} {b.unit}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-olive-800">New ingredient name</label>
              <input
                value={form.new_item_name}
                onChange={(e) => setForm({ ...form, new_item_name: e.target.value })}
                placeholder="e.g. Cardamom"
                className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-olive-800">Unit</label>
              <input
                value={form.new_item_unit}
                onChange={(e) => setForm({ ...form, new_item_unit: e.target.value })}
                className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-sm font-medium text-olive-800">Restock threshold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.new_item_reorder_threshold}
                onChange={(e) => setForm({ ...form, new_item_reorder_threshold: e.target.value })}
                className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="text-sm font-medium text-olive-800">Quantity purchased</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.quantity_purchased}
              onChange={(e) => setForm({ ...form, quantity_purchased: e.target.value })}
              className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive-800">Date</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-olive-800">Notes (optional)</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 px-5 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add to Bazar List'}
        </button>
      </form>

      <h2 className="text-lg font-display font-semibold mb-3">Today's entries</h2>
      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Ingredient</th>
              <th className="px-4 py-3 font-medium">Quantity added</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{entry.bazar_item_name}</td>
                <td className="px-4 py-3">+{entry.quantity_purchased} {entry.unit}</td>
                <td className="px-4 py-3 text-olive-600">{entry.purchase_date}</td>
                <td className="px-4 py-3 text-olive-600">{entry.notes || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleUndo(entry)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Undo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-sm text-olive-500 px-4 py-6">Nothing logged today yet.</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-semibold">Items to buy</h2>
        {shoppingList.length > 0 && (
          <button
            onClick={() => navigate('/admin/print/shopping-list')}
            className="text-sm px-4 py-1.5 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100"
          >
            Print shopping list
          </button>
        )}
      </div>
      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Ingredient</th>
              <th className="px-4 py-3 font-medium">Currently have</th>
              <th className="px-4 py-3 font-medium">Restock at</th>
            </tr>
          </thead>
          <tbody>
            {shoppingList.map((item) => (
              <tr key={item.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-paprika-600" />
                    {item.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-paprika-700">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-olive-600">{item.reorder_threshold} {item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shoppingList.length === 0 && (
          <p className="text-sm text-olive-500 px-4 py-6">Nothing needs restocking right now. 🎉</p>
        )}
      </div>
    </div>
  )
}
