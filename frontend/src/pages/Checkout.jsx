import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Checkout() {
  const { cart, refreshCart, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ delivery_address: '', phone: user?.phone || '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    refreshCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await client.post('/api/orders/checkout', form)
      await clearCart()
      navigate(`/orders`, { state: { justPlaced: res.data.id } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center text-olive-600">
        Your cart is empty. Add some dishes before checking out.
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="text-3xl font-display font-semibold mb-8">Checkout</h1>

      <div className="bg-olive-100 rounded-xl p-4 mb-6">
        <div className="flex justify-between text-sm text-olive-700 mb-1">
          <span>{cart.items.reduce((s, i) => s + i.quantity, 0)} items</span>
          <span>${cart.total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-olive-200 rounded-2xl p-6 space-y-4">
        {error && (
          <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-olive-800">Delivery address</label>
          <textarea
            required
            rows={2}
            value={form.delivery_address}
            onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-olive-800">Phone number</label>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-olive-800">Notes (optional)</label>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="e.g. no onions, ring the bell twice..."
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-paprika-500 text-ivory font-medium py-2.5 hover:bg-paprika-600 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Placing order...' : `Place order — $${cart.total.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}
