import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  category_id: '',
  stock_quantity: '',
  unit: 'pcs',
  reorder_threshold: '',
  is_available: true,
}

export default function AdminFoodItems() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([client.get('/api/food-items'), client.get('/api/categories')])
      .then(([itemsRes, catRes]) => {
        setItems(itemsRes.data)
        setCategories(catRes.data)
      })
      .finally(() => setLoading(false))
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
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      category_id: item.category_id || '',
      stock_quantity: item.stock_quantity,
      unit: item.unit,
      reorder_threshold: item.reorder_threshold,
      is_available: item.is_available,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: parseFloat(form.stock_quantity),
      reorder_threshold: parseFloat(form.reorder_threshold),
      category_id: form.category_id ? parseInt(form.category_id) : null,
    }
    try {
      if (editingId) {
        await client.put(`/api/food-items/${editingId}`, payload)
      } else {
        await client.post('/api/food-items', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item? This cannot be undone.')) return
    await client.delete(`/api/food-items/${id}`)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Food &amp; Inventory</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
        >
          + Add item
        </button>
      </div>

      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {item.stock_quantity} {item.unit}
                  {item.has_recipe && (
                    <span className="ml-1.5 text-xs text-olive-500">(auto)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {item.needs_restock ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-paprika-100 text-paprika-700 font-medium">
                      Needs restock
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-olive-100 text-olive-700 font-medium">
                      Stocked
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{item.is_available ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(item)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display font-semibold mb-4">
              {editingId ? 'Edit food item' : 'Add food item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-olive-800">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-olive-800">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-olive-800">Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm">
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-olive-800">Image URL</label>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-olive-800">Stock qty</label>
                  <input required type="number" step="0.01" min="0" value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Reorder at</label>
                  <input required type="number" step="0.01" min="0" value={form.reorder_threshold}
                    onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-olive-800">
                <input type="checkbox" checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
                Available for order
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600">
                  {editingId ? 'Save changes' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
