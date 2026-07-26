import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    client.get('/api/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (orderId, status) => {
    await client.put(`/api/orders/${orderId}/status`, { status })
    load()
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-display font-semibold">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border border-olive-300 px-4 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-olive-600 text-center py-16">No orders match this filter.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white border border-olive-100 rounded-xl p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-display font-semibold">Order #{order.id}</p>
                  <p className="text-xs text-olive-500 mt-0.5">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-olive-500 mt-0.5">
                    {order.phone} · {order.delivery_address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold text-paprika-600">${order.total_amount.toFixed(2)}</p>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="mt-1 text-sm rounded-full border border-olive-300 px-3 py-1"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ticket-divider my-4" />

              <ul className="text-sm text-olive-700 space-y-1">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.quantity} × {it.name}</span>
                    <span>${(it.quantity * it.price_at_order).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              {order.notes && <p className="text-xs text-olive-500 mt-3">Note: {order.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
