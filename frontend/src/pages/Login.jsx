import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(form.email, form.password)
      const redirectTo = location.state?.from || (user.role === 'admin' ? '/admin' : '/menu')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <div className="text-center mb-8">
        <span className="seal-badge w-14 h-14 text-ivory font-display font-semibold text-lg mx-auto mb-4">
          O&E
        </span>
        <h1 className="text-2xl font-display font-semibold">Welcome back</h1>
        <p className="text-olive-600 text-sm mt-1">Log in to order, rate and chat with our AI concierge.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-olive-200 rounded-2xl p-6 space-y-4">
        {error && (
          <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-olive-800">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-olive-800">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-paprika-500 text-ivory font-medium py-2.5 hover:bg-paprika-600 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-sm text-olive-700 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-paprika-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs text-olive-500 mt-6">
        Admin demo login: admin@restaurant.com / Admin@123
      </p>
    </div>
  )
}
