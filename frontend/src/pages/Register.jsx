import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(form.name, form.email, form.password, form.phone)
      navigate('/menu', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
        <h1 className="text-2xl font-display font-semibold">Create your account</h1>
        <p className="text-olive-600 text-sm mt-1">Join us to order food and leave reviews.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-olive-200 rounded-2xl p-6 space-y-4">
        {error && (
          <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-olive-800">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
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
          <label className="text-sm font-medium text-olive-800">Phone (optional)</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-olive-800">Password</label>
          <input
            type="password"
            required
            minLength={6}
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
          {busy ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="text-center text-sm text-olive-700 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-paprika-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
