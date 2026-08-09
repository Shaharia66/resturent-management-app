import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function PrintShoppingList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    client
      .get('/api/admin/bazar-items')
      .then((res) => setItems(res.data.filter((b) => b.needs_restock)))
      .finally(() => setLoading(false))
  }, [])

  const handlePrint = () => {
    window.print()
    setPrinted(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="print:hidden flex items-center justify-between mb-6">
        <h1 className="text-xl font-display font-semibold">Shopping List</h1>
        <button
          onClick={() => navigate('/admin/today-bazar')}
          className="text-sm text-olive-600 hover:text-paprika-600"
        >
          ← Back
        </button>
      </div>

      {printed && (
        <div className="print:hidden text-sm text-olive-700 bg-olive-100 border border-olive-200 rounded-lg px-3 py-2 mb-4">
          Printed ✓
        </div>
      )}

      <div className="border-2 border-dashed border-ink rounded-lg p-5 font-mono text-sm bg-white">
        <div className="text-center mb-3">
          <p className="font-display font-bold text-lg tracking-wide">SHOPPING LIST</p>
          <p className="text-xs">Olive &amp; Ember — {new Date().toLocaleDateString()}</p>
        </div>
        <div className="ticket-divider my-2" />

        {items.length === 0 ? (
          <p className="text-center text-xs py-4">Nothing needs restocking right now.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1.5 align-top w-6">☐</td>
                  <td className="py-1.5">{item.name}</td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    have {item.quantity}{item.unit} / need {item.reorder_threshold}{item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="ticket-divider my-2" />
        <p className="text-center text-xs">— End of list —</p>
      </div>

      <div className="print:hidden flex gap-3 mt-6">
        <button
          onClick={() => navigate('/admin/today-bazar')}
          className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
        >
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600"
        >
          Print list
        </button>
      </div>
    </div>
  )
}