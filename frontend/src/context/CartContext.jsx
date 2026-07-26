import React, { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], total: 0 })
      return
    }
    try {
      const res = await client.get('/api/cart')
      setCart(res.data)
    } catch {
      // ignore
    }
  }, [user])

  const addToCart = async (foodItemId, quantity = 1) => {
    const res = await client.post('/api/cart/add', { food_item_id: foodItemId, quantity })
    setCart(res.data)
  }

  const updateQuantity = async (foodItemId, quantity) => {
    const res = await client.put('/api/cart/update', { food_item_id: foodItemId, quantity })
    setCart(res.data)
  }

  const removeFromCart = async (foodItemId) => {
    const res = await client.delete(`/api/cart/remove/${foodItemId}`)
    setCart(res.data)
  }

  const clearCart = async () => {
    await client.delete('/api/cart/clear')
    setCart({ items: [], total: 0 })
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ cart, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
