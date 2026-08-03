import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    `text-sm font-medium tracking-wide transition-colors ${
      isActive ? 'text-paprika-600' : 'text-olive-800 hover:text-paprika-500'
    }`

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-olive-200 print:hidden">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="seal-badge w-9 h-9 text-ivory font-display font-semibold text-sm">
            O&E
          </span>
          <span className="font-display text-lg font-semibold text-ink">Olive &amp; Ember</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/menu" className={linkClass}>Menu</NavLink>
          {user && !isAdmin && <NavLink to="/ask-ai" className={linkClass}>Ask AI</NavLink>}
          {user && !isAdmin && <NavLink to="/orders" className={linkClass}>My Orders</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkClass}>Admin Dashboard</NavLink>}
        </nav>

        <div className="flex items-center gap-4">
          {!isAdmin && (
            <Link
              to="/cart"
              className="relative text-olive-800 hover:text-paprika-500 transition-colors"
              aria-label="View cart"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-paprika-500 text-ivory text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-olive-700">Hi, {user.name.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-3 py-1.5 rounded-full border border-olive-300 text-olive-800 hover:bg-olive-100 transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium px-3 py-1.5 text-olive-800 hover:text-paprika-500">
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium px-3.5 py-1.5 rounded-full bg-paprika-500 text-ivory hover:bg-paprika-600 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
