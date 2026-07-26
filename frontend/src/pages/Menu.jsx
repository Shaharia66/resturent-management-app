import React, { useEffect, useState } from 'react'
import client from '../api/client'
import FoodCard from '../components/FoodCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Menu() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/api/categories').then((res) => setCategories(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (activeCategory) params.category_id = activeCategory
    if (search) params.search = search
    const timeout = setTimeout(() => {
      client
        .get('/api/food-items', { params })
        .then((res) => setItems(res.data))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timeout)
  }, [activeCategory, search])

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.15em] text-paprika-600 font-medium">
          Today's offerings
        </span>
        <h1 className="text-3xl font-display font-semibold mt-1">Full Menu</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !activeCategory
                ? 'bg-paprika-500 border-paprika-500 text-ivory'
                : 'border-olive-300 text-olive-700 hover:bg-olive-100'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                activeCategory === c.id
                  ? 'bg-paprika-500 border-paprika-500 text-ivory'
                  : 'border-olive-300 text-olive-700 hover:bg-olive-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes..."
          className="rounded-full border border-olive-300 px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-paprika-400"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="text-olive-600 text-center py-16">No dishes match your search.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
