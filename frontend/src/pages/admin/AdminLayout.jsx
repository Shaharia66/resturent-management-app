import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/tables', label: 'Dine-In Tables', end: true },
  { to: '/admin/tables/settings', label: 'Table Settings' },
  { to: '/admin/food-items', label: 'Food & Inventory' },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/orders', label: 'Online Orders' },
  { to: '/admin/ai', label: 'Ask AI' },
]

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-[200px_1fr] gap-8">
      <aside>
        <h2 className="font-display font-semibold text-lg mb-4">Admin</h2>
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-paprika-500 text-ivory font-medium'
                    : 'text-olive-700 hover:bg-olive-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
