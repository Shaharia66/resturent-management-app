import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = { name: '', capacity: 4 }

export default function AdminTableSettings() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    client.get('/api/admin/tables').then((res) => setTables(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (table) => {
    setEditingId(table.id)
    setForm({ name: table.name, capacity: table.capacity })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { name: form.name, capacity: parseInt(form.capacity) || 1 }
    try {
      if (editingId) {
        await client.put(`/api/admin/tables/${editingId}`, payload)
      } else {
        await client.post('/api/admin/tables', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  const toggleActive = async (table) => {
    await client.put(`/api/admin/tables/${table.id}`, { is_active: !table.is_active })
    load()
  }

  const handleDelete = async (table) => {
    if (!window.confirm(`Remove ${table.name}? This only works if it has no active order.`)) return
    try {
      await client.delete(`/api/admin/tables/${table.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete this table.')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Table Settings</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
        >
          + Add table
        </button>
      </div>

      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Capacity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Currently</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{table.name}</td>
                <td className="px-4 py-3">{table.capacity} seats</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    table.is_active ? 'bg-olive-100 text-olive-700' : 'bg-paprika-100 text-paprika-700'
                  }`}>
                    {table.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3 text-olive-600">
                  {table.is_occupied ? 'Occupied' : 'Free'}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => toggleActive(table)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    {table.is_active ? 'Hide' : 'Unhide'}
                  </button>
                  <button onClick={() => openEdit(table)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(table)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tables.length === 0 && (
        <p className="text-sm text-olive-500 mt-4">No tables yet — click "Add table" to create your first one.</p>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-display font-semibold mb-4">
              {editingId ? 'Edit table' : 'Add table'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-olive-800">Table name</label>
                <input
                  required
                  placeholder="e.g. Table 5"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-olive-800">Capacity (seats)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm"
                />
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
                  {editingId ? 'Save changes' : 'Add table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}