import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PrintKitchenTicket() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)

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

  if (loading) return <LoadingSpinner />
  if (!order) return <p className="text-center py-16">Order not found.</p>

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="print:hidden flex items-center justify-between mb-6">
        <h1 className="text-xl font-display font-semibold">Kitchen Order Ticket</h1>
        <button
          onClick={() => navigate('/admin/tables')}
          className="text-sm text-olive-600 hover:text-paprika-600"
        >
          ← Back to tables
        </button>
      </div>

      {printed && (
        <div className="print:hidden text-sm text-olive-700 bg-olive-100 border border-olive-200 rounded-lg px-3 py-2 mb-4">
          Printed ✓
        </div>
      )}

      <div className="border-2 border-dashed border-ink rounded-lg p-5 font-mono text-sm bg-white">
        <div className="text-center mb-3">
          <p className="font-display font-bold text-lg tracking-wide">KITCHEN TICKET</p>
          <p className="text-xs">Olive &amp; Ember</p>
        </div>
        <div className="ticket-divider my-2" />
        <div className="flex justify-between">
          <span>Table:</span>
          <span className="font-bold">{order.table_name}</span>
        </div>
        <div className="flex justify-between">
          <span>Order #:</span>
          <span>{order.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div className="ticket-divider my-2" />
        <table className="w-full">
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="py-1 align-top w-10 font-bold">{it.quantity}x</td>
                <td className="py-1">
                  {it.name}
                  {it.notes && <div className="text-xs italic">Note: {it.notes}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ticket-divider my-2" />
        <p className="text-center text-xs">— Start cooking —</p>
      </div>

      <div className="print:hidden flex gap-3 mt-6">
        <button
          onClick={() => navigate('/admin/tables')}
          className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
        >
          Back to tables
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
        >
          Print ticket
        </button>
      </div>
    </div>
  )
}