import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

function StatCard({ label, value, accent = false }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? 'bg-olive-800 text-ivory border-olive-800' : 'bg-white border-olive-100'}`}>
      <p className={`text-xs uppercase tracking-wide ${accent ? 'text-olive-300' : 'text-olive-500'}`}>{label}</p>
      <p className="text-3xl font-display font-semibold mt-1">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get('/api/food-items'),
      client.get('/api/employees'),
      client.get('/api/orders'),
    ]).then(([foodRes, empRes, orderRes]) => {
      const foodItems = foodRes.data
      const employees = empRes.data
      const orders = orderRes.data

      const needsRestock = foodItems.filter((f) => f.needs_restock)
      const pendingOrders = orders.filter((o) => ['pending', 'confirmed', 'preparing'].includes(o.status))
      const revenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0)

      setStats({
        totalFoodItems: foodItems.length,
        needsRestock,
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.is_active).length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        revenue,
      })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total revenue" value={`$${stats.revenue.toFixed(2)}`} accent />
        <StatCard label="Total orders" value={stats.totalOrders} />
        <StatCard label="Pending / active orders" value={stats.pendingOrders} />
        <StatCard label="Employees" value={`${stats.activeEmployees} / ${stats.totalEmployees}`} />
      </div>

      <div className="bg-white border border-olive-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold">Items needing restock</h2>
          <Link to="/admin/food-items" className="text-sm text-paprika-600 hover:underline">
            Manage inventory →
          </Link>
        </div>
        {stats.needsRestock.length === 0 ? (
          <p className="text-sm text-olive-600">Everything is well stocked. 🎉</p>
        ) : (
          <ul className="space-y-2">
            {stats.needsRestock.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm border-b border-olive-50 pb-2">
                <span>{item.name}</span>
                <span className="text-paprika-600 font-medium">
                  {item.stock_quantity} {item.unit} left (reorder at {item.reorder_threshold})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 bg-olive-100 rounded-2xl p-5">
        <p className="text-sm text-olive-800">
          Need a quick summary of staffing or stock levels? Head to{' '}
          <Link to="/admin/ai" className="text-paprika-600 font-medium hover:underline">Ask AI</Link>{' '}
          and ask in plain language — e.g. "which items should I buy this week?"
        </p>
      </div>
    </div>
  )
}
