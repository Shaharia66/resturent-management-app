import React, { useEffect, useState } from 'react'
import client from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function StatusTracker({ status }) {
  if (status === 'cancelled') {
    return <span className="text-sm text-paprika-700 font-medium">Cancelled</span>
  }
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {STATUS_STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              idx <= currentIdx ? 'bg-paprika-500' : 'bg-olive-200'
            }`}
            title={STATUS_LABELS[step]}
          />
          {idx < STATUS_STEPS.length - 1 && (
            <div className={`h-0.5 w-6 ${idx < currentIdx ? 'bg-paprika-500' : 'bg-olive-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .get('/api/orders/my')
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display font-semibold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-olive-600 text-center py-16">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-olive-100 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold">Order #{order.id}</p>
                  <p className="text-xs text-olive-500 mt-0.5">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-olive-100 text-olive-800">
                    {STATUS_LABELS[order.status]}
                  </span>
                  <p className="font-display font-semibold text-paprika-600 mt-1">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <StatusTracker status={order.status} />

              <div className="ticket-divider my-4" />

              <ul className="text-sm text-olive-700 space-y-1">
                {order.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.quantity} × {it.name}</span>
                    <span>${(it.quantity * it.price_at_order).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              {order.delivery_address && (
                <p className="text-xs text-olive-500 mt-3">
                  Delivering to: {order.delivery_address}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
