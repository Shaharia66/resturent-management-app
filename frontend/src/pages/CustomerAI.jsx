import React from 'react'
import client from '../api/client'
import ChatPanel from '../components/ChatPanel'

const SUGGESTIONS = [
  'What is the highest rated dish?',
  'Do you have any vegetarian options?',
  'What are people saying about the cheesecake?',
  'Recommend something under $8',
]

export default function CustomerAI() {
  const handleAsk = async (question) => {
    const res = await client.post('/api/ai/customer/ask', { question })
    return res.data.answer
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <div className="mb-6">
        <span className="text-xs uppercase tracking-[0.15em] text-paprika-600 font-medium">
          AI Concierge
        </span>
        <h1 className="text-3xl font-display font-semibold mt-1">Ask about our menu</h1>
        <p className="text-olive-600 text-sm mt-1">
          Get info on ingredients, prices, ratings and what other customers are saying.
        </p>
      </div>
      <ChatPanel onAsk={handleAsk} suggestions={SUGGESTIONS} placeholder="e.g. What's good for dessert?" />
    </div>
  )
}
