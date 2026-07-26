import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

const emptyForm = {
  name: '', position: '', department: '', salary: '', phone: '', email: '', is_active: true,
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    client.get('/api/employees').then((res) => setEmployees(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (emp) => {
    setEditingId(emp.id)
    setForm({
      name: emp.name, position: emp.position, department: emp.department || '',
      salary: emp.salary, phone: emp.phone || '', email: emp.email || '', is_active: emp.is_active,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = { ...form, salary: parseFloat(form.salary) || 0 }
    try {
      if (editingId) {
        await client.put(`/api/employees/${editingId}`, payload)
      } else {
        await client.post('/api/employees', payload)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this employee record?')) return
    await client.delete(`/api/employees/${id}`)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold">Employees</h1>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600">
          + Add employee
        </button>
      </div>

      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Salary</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{emp.name}</td>
                <td className="px-4 py-3">{emp.position}</td>
                <td className="px-4 py-3">{emp.department || '—'}</td>
                <td className="px-4 py-3">${emp.salary.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    emp.is_active ? 'bg-olive-100 text-olive-700' : 'bg-paprika-100 text-paprika-700'
                  }`}>
                    {emp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => openEdit(emp)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="text-olive-700 hover:text-paprika-600 text-xs font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-display font-semibold mb-4">
              {editingId ? 'Edit employee' : 'Add employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-olive-800">Full name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-olive-800">Position</label>
                  <input required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-olive-800">Monthly salary ($)</label>
                <input required type="number" step="0.01" min="0" value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-olive-800">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-olive-800">Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-olive-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-olive-800">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Currently active
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600">
                  {editingId ? 'Save changes' : 'Add employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
