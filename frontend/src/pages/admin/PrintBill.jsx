import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

function BillCopy({ order, copyLabel }) {
  return (
    <div className="border-2 border-dashed border-ink rounded-lg p-5 font-mono text-sm bg-white break-after-page">
      <div className="text-center mb-3">
        <p className="font-display font-bold text-lg tracking-wide">Olive &amp; Ember</p>
        <p className="text-xs">{copyLabel}</p>
      </div>
      <div className="ticket-divider my-2" />
      <div className="flex justify-between">
        <span>Table:</span>
        <span className="font-bold">{order.table_name}</span>
      </div>
      <div className="flex justify-between">
        <span>Bill #:</span>
        <span>{order.id}</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{new Date().toLocaleString()}</span>
      </div>
      <div className="ticket-divider my-2" />
      <table className="w-full">
        <thead>
          <tr className="text-xs">
            <td className="pb-1">Item</td>
            <td className="pb-1 text-right">Qty</td>
            <td className="pb-1 text-right">Price</td>
            <td className="pb-1 text-right">Total</td>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id}>
              <td className="py-0.5">{it.name}</td>
              <td className="py-0.5 text-right">{it.quantity}</td>
              <td className="py-0.5 text-right">${it.price_at_order.toFixed(2)}</td>
              <td className="py-0.5 text-right">${(it.quantity * it.price_at_order).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ticket-divider my-2" />
      <div className="flex justify-between text-base font-bold">
        <span>TOTAL</span>
        <span>${order.total_amount.toFixed(2)}</span>
      </div>
      <p className="text-center text-xs mt-3">Thank you for dining with us!</p>
    </div>
  )
}

export default function PrintBill() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    client
      .get(`/api/admin/table-orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false))
  }, [orderId])

  const handlePrint = () => {
    window.print()
    setPrinted(true)
  }

  const confirmAndBack = async () => {
    setConfirming(true)
    try {
      if (order.status === 'delivered') {
        await client.put(`/api/admin/table-orders/${order.id}/status`, { status: 'bill_given' })
      }
      navigate('/admin/tables')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!order) return <p className="text-center py-16">Order not found.</p>

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="print:hidden flex items-center justify-between mb-6">
        <h1 className="text-xl font-display font-semibold">Print Bill</h1>
        <button
          onClick={() => navigate('/admin/tables')}
          className="text-sm text-olive-600 hover:text-paprika-600"
        >
          ← Back to tables
        </button>
      </div>

      {printed && (
        <div className="print:hidden text-sm text-olive-700 bg-olive-100 border border-olive-200 rounded-lg px-3 py-2 mb-4">
          Printed ✓ — 2 copies (customer + restaurant)
        </div>
      )}

      <div className="space-y-6">
        <BillCopy order={order} copyLabel="Customer Copy" />
        <BillCopy order={order} copyLabel="Restaurant Copy" />
      </div>

      <div className="print:hidden flex gap-3 mt-6">
        <button
          onClick={handlePrint}
          className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
        >
          Print bill
        </button>
        <button
          onClick={confirmAndBack}
          disabled={confirming}
          className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50"
        >
          {confirming ? 'Saving...' : 'Done — back to tables'}
        </button>
      </div>
    </div>
  )
}