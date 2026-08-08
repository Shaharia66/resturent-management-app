import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function AdminMakingFoodInfo() {
  const [foodItems, setFoodItems] = useState([])
  const [bazarItems, setBazarItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeFood, setActiveFood] = useState(null)
  const [rows, setRows] = useState([])
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([client.get('/api/food-items'), client.get('/api/admin/bazar-items')])
      .then(([foodRes, bazarRes]) => {
        setFoodItems(foodRes.data)
        setBazarItems(bazarRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openRecipe = async (foodItem) => {
    setActiveFood(foodItem)
    setError('')
    setRecipeLoading(true)
    try {
      const res = await client.get(`/api/admin/food-items/${foodItem.id}/recipe`)
      setRows(
        res.data.ingredients.map((ing) => ({
          bazar_item_id: ing.bazar_item_id,
          quantity_per_unit: ing.quantity_per_unit,
        }))
      )
    } finally {
      setRecipeLoading(false)
    }
  }

  const addRow = () => {
    if (bazarItems.length === 0) return
    setRows((prev) => [...prev, { bazar_item_id: bazarItems[0].id, quantity_per_unit: 1 }])
  }

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const saveRecipe = async () => {
    setError('')
    const cleaned = rows
      .filter((r) => r.bazar_item_id && parseFloat(r.quantity_per_unit) > 0)
      .map((r) => ({
        bazar_item_id: parseInt(r.bazar_item_id),
        quantity_per_unit: parseFloat(r.quantity_per_unit),
      }))
    setSaving(true)
    try {
      await client.put(`/api/admin/food-items/${activeFood.id}/recipe`, { ingredients: cleaned })
      setActiveFood(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save recipe.')
    } finally {
      setSaving(false)
    }
  }

  const clearRecipe = async () => {
    if (!window.confirm(`Remove the recipe for "${activeFood.name}"? It will go back to manual stock tracking.`)) return
    setSaving(true)
    try {
      await client.delete(`/api/admin/food-items/${activeFood.id}/recipe`)
      setActiveFood(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-2">Making Food Info</h1>
      <p className="text-sm text-olive-600 mb-6">
        Define the recipe for each dish — which raw ingredients (from the Bazar List) and how much of
        each are needed to make one unit. Once a dish has a recipe, its stock on the Food &amp; Inventory
        page is calculated automatically from your Bazar List.
      </p>

      {bazarItems.length === 0 && (
        <div className="text-sm text-olive-700 bg-olive-100 border border-olive-200 rounded-lg px-3 py-2 mb-4">
          You haven't added any raw ingredients yet. Go to <span className="font-medium">Bazar List</span> first.
        </div>
      )}

      <div className="bg-white border border-olive-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-olive-500 border-b border-olive-100">
              <th className="px-4 py-3 font-medium">Dish</th>
              <th className="px-4 py-3 font-medium">Stock tracking</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {foodItems.map((item) => (
              <tr key={item.id} className="border-b border-olive-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                <td className="px-4 py-3">
                  {item.has_recipe ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-olive-100 text-olive-700 font-medium">
                      Auto (from recipe)
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-olive-50 text-olive-500 font-medium">
                      Manual
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openRecipe(item)}
                    className="text-olive-700 hover:text-paprika-600 text-xs font-medium"
                  >
                    {item.has_recipe ? 'Edit recipe' : 'Add recipe'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeFood && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-ivory rounded-2xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-display font-semibold mb-1">Recipe — {activeFood.name}</h2>
            <p className="text-sm text-olive-600 mb-4">
              How much of each ingredient is needed to make <span className="font-medium">one</span> {activeFood.name}.
            </p>

            {error && (
              <div className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            {recipeLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {rows.length === 0 && (
                    <p className="text-sm text-olive-500">No ingredients added yet.</p>
                  )}
                  {rows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={row.bazar_item_id}
                        onChange={(e) => updateRow(index, 'bazar_item_id', e.target.value)}
                        className="flex-1 rounded-lg border border-olive-300 px-3 py-2 text-sm"
                      >
                        {bazarItems.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.quantity_per_unit}
                        onChange={(e) => updateRow(index, 'quantity_per_unit', e.target.value)}
                        className="w-24 rounded-lg border border-olive-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => removeRow(index)}
                        className="text-olive-400 hover:text-paprika-600 px-1"
                        aria-label="Remove ingredient"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addRow}
                  disabled={bazarItems.length === 0}
                  className="mt-3 text-sm text-paprika-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline text-left"
                >
                  + Add ingredient row
                </button>

                <div className="flex gap-3 pt-4 mt-2 border-t border-olive-200">
                  <button
                    onClick={() => setActiveFood(null)}
                    className="flex-1 py-2.5 rounded-full border border-olive-300 text-olive-700 text-sm font-medium hover:bg-olive-100"
                  >
                    Cancel
                  </button>
                  {activeFood.has_recipe && (
                    <button
                      onClick={clearRecipe}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-full border border-paprika-300 text-paprika-700 text-sm font-medium hover:bg-paprika-50 disabled:opacity-50"
                    >
                      Clear recipe
                    </button>
                  )}
                  <button
                    onClick={saveRecipe}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save recipe'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}