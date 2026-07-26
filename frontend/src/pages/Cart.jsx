import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, refreshCart, updateQuantity, removeFromCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    refreshCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display font-semibold mb-8">Your Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-olive-600 mb-4">Your cart is empty.</p>
          <Link to="/menu" className="text-paprika-600 font-medium hover:underline">
            Browse the menu →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.food_item_id}
                className="flex items-center gap-4 bg-white border border-olive-100 rounded-xl p-4"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-olive-600">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.food_item_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.food_item_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100"
                  >
                    +
                  </button>
                </div>
                <p className="w-16 text-right font-medium text-ink">${item.subtotal.toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.food_item_id)}
                  className="text-olive-400 hover:text-paprika-600"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="ticket-divider my-8" />

          <div className="flex items-center justify-between">
            <span className="text-lg font-display font-semibold">Total</span>
            <span className="text-2xl font-display font-semibold text-paprika-600">
              ${cart.total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full mt-6 py-3 rounded-full bg-paprika-500 text-ivory font-medium hover:bg-paprika-600 transition-colors"
          >
            Proceed to checkout
          </button>
        </>
      )}
    </div>
  )
}
