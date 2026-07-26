import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import FoodCard from '../components/FoodCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client
      .get('/api/food-items', { params: { only_available: true } })
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => b.average_rating - a.average_rating)
        setItems(sorted.slice(0, 4))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-olive-800 text-ivory">
        <div className="max-w-6xl mx-auto px-5 py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-mustard-400 font-medium mb-4">
              Kitchen order no. 001 — table for you
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-semibold leading-tight">
              Slow-cooked flavor,
              <br />served without delay.
            </h1>
            <p className="text-olive-200 mt-5 max-w-md">
              Browse today's menu, see what fellow diners rated highest, and let our
              AI concierge help you pick your next favorite dish.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                to="/menu"
                className="px-6 py-3 rounded-full bg-paprika-500 hover:bg-paprika-600 font-medium transition-colors"
              >
                View the menu
              </Link>
              <Link
                to="/ask-ai"
                className="px-6 py-3 rounded-full border border-olive-400 hover:bg-olive-700 font-medium transition-colors"
              >
                Ask our AI concierge
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="ticket-divider md:hidden my-6" />
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500"
                alt="Plated dish"
                className="rounded-2xl object-cover h-48 w-full"
              />
              <img
                src="https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=500"
                alt="Chef preparing food"
                className="rounded-2xl object-cover h-48 w-full mt-8"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Top rated */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.15em] text-paprika-600 font-medium">
              Diners' favorites
            </span>
            <h2 className="text-2xl font-display font-semibold mt-1">Top rated dishes</h2>
          </div>
          <Link to="/menu" className="text-sm font-medium text-paprika-600 hover:underline">
            Full menu →
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Feature strip */}
      <section className="bg-olive-100">
        <div className="max-w-6xl mx-auto px-5 py-14 grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Real reviews',
              desc: 'Star ratings and comments from real customers on every dish.',
            },
            {
              title: 'AI concierge',
              desc: 'Ask about ingredients, prices, or get a recommendation instantly.',
            },
            {
              title: 'Track your order',
              desc: 'Follow your order from the kitchen to your door in real time.',
            },
          ].map((f, idx) => (
            <div key={f.title}>
              <span className="text-xs font-display text-paprika-600">0{idx + 1}</span>
              <h3 className="font-display font-semibold text-lg mt-1">{f.title}</h3>
              <p className="text-sm text-olive-700 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
