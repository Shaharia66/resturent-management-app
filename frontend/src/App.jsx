import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import FoodDetail from './pages/FoodDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import CustomerAI from './pages/CustomerAI'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFoodItems from './pages/admin/AdminFoodItems'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminOrders from './pages/admin/AdminOrders'
import AdminAI from './pages/admin/AdminAI'
import AdminTables from './pages/admin/AdminTables'
import AdminTableSettings from './pages/admin/AdminTableSettings'
import PrintKitchenTicket from './pages/admin/PrintKitchenTicket'
import PrintBill from './pages/admin/PrintBill'
import AdminBazarList from './pages/admin/AdminBazarList'
import AdminMakingFoodInfo from './pages/admin/AdminMakingFoodInfo'


export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/food/:id" element={<FoodDetail />} />

          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/ask-ai" element={<ProtectedRoute><CustomerAI /></ProtectedRoute>} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
            
          >
            <Route index element={<AdminDashboard />} />
            <Route path="food-items" element={<AdminFoodItems />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="ai" element={<AdminAI />} />
            <Route path="tables" element={<AdminTables />} />
            <Route path="tables/settings" element={<AdminTableSettings />} />
            <Route path="bazar" element={<AdminBazarList />} />
            <Route path="making-food-info" element={<AdminMakingFoodInfo />} />
            
          </Route>
          {/* Print pages render full-screen, without the admin sidebar */}
          <Route
            path="/admin/print/kitchen/:orderId"
            element={
              <ProtectedRoute adminOnly>
                <PrintKitchenTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/print/bill/:orderId"
            element={
              <ProtectedRoute adminOnly>
                <PrintBill />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <footer className="border-t border-olive-200 py-8 mt-10 print:hidden">
        <div className="max-w-6xl mx-auto px-5 text-center text-sm text-olive-500">
          © {new Date().getFullYear()} Olive &amp; Ember Restaurant. Built with FastAPI, React, MySQL &amp; Redis.
        </div>
      </footer>
    </div>
  )
}
