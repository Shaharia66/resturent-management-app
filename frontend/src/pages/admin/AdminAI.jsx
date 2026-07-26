import React from 'react'
import client from '../../api/client'
import ChatPanel from '../../components/ChatPanel'

const SUGGESTIONS = [
  'Which items need to be restocked?',
  'How many employees work in the kitchen?',
  'What is our total monthly payroll?',
  'Which food items are overstocked?',
]

export default function AdminAI() {
  const handleAsk = async (question) => {
    const res = await client.post('/api/ai/admin/ask', { question })
    return res.data.answer
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-xs uppercase tracking-[0.15em] text-paprika-600 font-medium">
          Operations Assistant
        </span>
        <h1 className="text-2xl font-display font-semibold mt-1">Ask about staff & inventory</h1>
        <p className="text-olive-600 text-sm mt-1">
          Ask in plain language about employees, staffing, or which food items you need to buy.
        </p>
      </div>
      <ChatPanel onAsk={handleAsk} suggestions={SUGGESTIONS} placeholder="e.g. What should I buy this week?" />
    </div>
  )
}
