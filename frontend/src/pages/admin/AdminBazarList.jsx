import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = { name: '', quantity: '', unit: 'g', reorder_threshold: '' }

export default function AdminBazarList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    client.get('/api/admin/bazar-items').then((res) => setItems(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      reorder_threshold: item.reorder_threshold,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      reorder_threshold: parseFloat(form.reorder_threshold) || 0,
    }
    try {
      if (editingId) {
        await client.put(`/api/admin/bazar-items/${editingId}`, payload)
      } else {
        await client.post('/api/admin/bazar-items', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from the Bazar List?`)) return
    try {
      await client.delete(`/api/admin/bazar-items/${item.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete this ingredient.')
    }
  }

  if (loading) return <LoadingSpinner />

  const lowStockCount = items.filter((i) => i.needs_restock).length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-display font-semibold">Bazar List</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
        >
          + Add ingredient
        </button>
      </div>
      <p className="text-sm text-olive-600 mb-6">
        Your raw ingredient stock. Quantities here automatically decrease when dishes with a recipe
        (set up in Making Food Info) are ordered.
      </p>

      {lowStockCount > 0 && (
        <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mb-4">
          {lowStockCount} ingredient{lowStockCount > 1 ? 's' : ''} need{lowStockCount === 1 ? 's' : ''} restocking.
        </div>
      )}

      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Ingredient</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Restock at</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="px-4 py-3">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-olive-600">{item.reorder_threshold} {item.unit}</td>
                <td className="px-4 py-3">
                  {item.needs_restock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-paprika-100 text-paprika-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-paprika-600" /> Needs restock
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-olive-100 text-olive-700 font-medium">
                      OK
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(item)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-olive-500 mt-4">
          No ingredients yet — click "Add ingredient" to start building your Bazar List.
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-display font-semibold mb-4">
              {editingId ? 'Edit ingredient' : 'Add ingredient'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-olive-800">Ingredient name</label>
                <input
                  required
                  placeholder="e.g. Sugar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-olive-800">Quantity on hand</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Unit</label>
                  <input
                    placeholder="g, ml, pcs..."
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-olive-800">Restock threshold</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.reorder_threshold}
                  onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-olive-500 mt-1">
                  You'll see a red "needs restock" signal once quantity drops to or below this number.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
                >
                  {editingId ? 'Save changes' : 'Add ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}