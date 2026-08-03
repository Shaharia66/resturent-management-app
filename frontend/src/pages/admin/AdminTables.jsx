import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_LABELS = {
  received: 'Order Received',
  delivered: 'Delivered',
  bill_given: 'Bill Given',
  bill_received: 'Bill Received',
}

const STATUS_STYLES = {
  received: 'bg-mustard-500 border-mustard-600',
  delivered: 'bg-olive-500 border-olive-600',
  bill_given: 'bg-paprika-500 border-paprika-600',
}

function TableCard({ table, onClick }) {
  const occupied = table.is_occupied
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-4 h-32 flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${
        occupied
          ? `${STATUS_STYLES[table.active_order_status]} text-ivory`
          : 'bg-white border-olive-200 hover:border-paprika-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`font-display font-semibold text-lg ${occupied ? 'text-ivory' : 'text-ink'}`}>
          {table.name}
        </span>
        <span className={`text-xs ${occupied ? 'text-ivory/80' : 'text-olive-500'}`}>
          Seats {table.capacity}
        </span>
      </div>
      <span className={`text-sm font-medium ${occupied ? 'text-ivory' : 'text-olive-600'}`}>
        {occupied ? STATUS_LABELS[table.active_order_status] : 'Free'}
      </span>
    </button>
  )
}

export default function AdminTables() {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [foodItems, setFoodItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [newOrderTable, setNewOrderTable] = useState(null)
  const [selectedQuantities, setSelectedQuantities] = useState({})
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')

  const [activeOrder, setActiveOrder] = useState(null)
  const [orderBusy, setOrderBusy] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([client.get('/api/admin/tables'), client.get('/api/food-items', { params: { only_available: true } })])
      .then(([tablesRes, foodRes]) => {
        setTables(tablesRes.data)
        setFoodItems(foodRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openTable = async (table) => {
    if (table.is_occupied) {
      const res = await client.get(`/api/admin/table-orders/${table.active_order_id}`)
      setActiveOrder(res.data)
    } else {
      setSelectedQuantities({})
      setOrderError('')
      setNewOrderTable(table)
    }
  }

  const changeQty = (foodItemId, delta) => {
    setSelectedQuantities((prev) => {
      const next = { ...prev }
      const current = next[foodItemId] || 0
      const updated = Math.max(0, current + delta)
      if (updated === 0) {
        delete next[foodItemId]
      } else {
        next[foodItemId] = updated
      }
      return next
    })
  }

  const placeOrder = async () => {
    const items = Object.entries(selectedQuantities).map(([food_item_id, quantity]) => ({
      food_item_id: parseInt(food_item_id),
      quantity,
    }))
    if (items.length === 0) {
      setOrderError('Select at least one item.')
      return
    }
    setOrderError('')
    setPlacingOrder(true)
    try {
      const res = await client.post('/api/admin/table-orders', {
        table_id: newOrderTable.id,
        items,
      })
      setNewOrderTable(null)
      navigate(`/admin/print/kitchen/${res.data.id}`)
    } catch (err) {
      setOrderError(err.response?.data?.detail || 'Could not place order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const markDelivered = async () => {
    setOrderBusy(true)
    try {
      await client.put(`/api/admin/table-orders/${activeOrder.id}/status`, { status: 'delivered' })
      setActiveOrder(null)
      load()
    } finally {
      setOrderBusy(false)
    }
  }

  const goToPrintBill = () => {
    navigate(`/admin/print/bill/${activeOrder.id}`)
  }

  const markBillReceived = async () => {
    setOrderBusy(true)
    try {
      await client.put(`/api/admin/table-orders/${activeOrder.id}/status`, { status: 'bill_received' })
      setActiveOrder(null)
      load()
    } finally {
      setOrderBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Dine-In Tables</h1>
        <div className="flex items-center gap-4 text-xs text-olive-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border-2 border-olive-300" /> Free</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-mustard-500" /> Received</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-olive-500" /> Delivered</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-paprika-500" /> Bill given</span>
        </div>
      </div>

      {tables.length === 0 ? (
        <p className="text-olive-600 text-center py-16">
          No tables set up yet. Go to <span className="font-medium">Table Settings</span> to add some.
        </p>
      ) : (
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.filter((t) => t.is_active).map((table) => (
            <TableCard key={table.id} table={table} onClick={() => openTable(table)} />
          ))}
        </div>
      )}

      {newOrderTable && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-display font-semibold mb-1">New order — {newOrderTable.name}</h2>
            <p className="text-sm text-olive-600 mb-4">Select items and quantities for this table.</p>

            {orderError && (
              <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mb-3">
                {orderError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {foodItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-olive-100 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-olive-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="w-7 h-7 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{selectedQuantities[item.id] || 0}</span>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      className="w-7 h-7 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 mt-2 border-t border-olive-200">
              <button
                onClick={() => setNewOrderTable(null)}
                className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                disabled={placingOrder}
                className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50"
              >
                {placingOrder ? 'Placing...' : 'Place order & print kitchen ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeOrder && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-display font-semibold">{activeOrder.table_name}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-olive-100 text-olive-800 font-medium">
                {STATUS_LABELS[activeOrder.status]}
              </span>
            </div>
            <p className="text-sm text-olive-600 mb-4">Order #{activeOrder.id}</p>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {activeOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm border-b border-olive-50 pb-1.5">
                  <span>{it.quantity} × {it.name}</span>
                  <span>${(it.quantity * it.price_at_order).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-olive-200">
              <span className="font-medium text-olive-800">Total</span>
              <span className="font-display font-semibold text-paprika-600">
                ${activeOrder.total_amount.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setActiveOrder(null)}
                className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
              >
                Close
              </button>

              {activeOrder.status === 'received' && (
                <>
                  <button
                    onClick={() => navigate(`/admin/print/kitchen/${activeOrder.id}`)}
                    className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
                  >
                    Reprint ticket
                  </button>
                  <button
                    onClick={markDelivered}
                    disabled={orderBusy}
                    className="flex-1 py-2.5 rounded-full bg-olive-800 text-ivory text-sm font-medium hover:bg-olive-900 disabled:opacity-50"
                  >
                    Mark delivered
                  </button>
                </>
              )}

              {activeOrder.status === 'delivered' && (
                <button
                  onClick={goToPrintBill}
                  className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
                >
                  Give bill (print)
                </button>
              )}

              {activeOrder.status === 'bill_given' && (
                <button
                  onClick={markBillReceived}
                  disabled={orderBusy}
                  className="flex-1 py-2.5 rounded-full bg-olive-800 text-ivory text-sm font-medium hover:bg-olive-900 disabled:opacity-50"
                >
                  Bill received — free table
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}