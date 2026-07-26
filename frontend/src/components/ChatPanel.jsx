import React, { useRef, useState, useEffect } from 'react'

export default function ChatPanel({ onAsk, suggestions = [], placeholder = 'Ask a question...' }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, busy])

  const send = async (text) => {
    const question = (text ?? input).trim()
    if (!question || busy) return
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    setBusy(true)
    try {
      const answer = await onAsk(question)
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col bg-white border border-olive-200 rounded-2xl overflow-hidden h-[70vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <span className="seal-badge w-12 h-12 text-ivory font-display font-semibold text-sm mx-auto mb-4">
              AI
            </span>
            <p className="text-olive-600 text-sm max-w-sm mx-auto">
              Ask anything below, or try one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-olive-300 text-olive-700 hover:bg-olive-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-paprika-500 text-ivory rounded-br-sm'
                  : 'bg-olive-100 text-ink rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="bg-olive-100 text-olive-600 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        className="border-t border-olive-200 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-olive-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-5 py-2.5 rounded-full bg-paprika-500 text-ivory text-sm font-medium hover:bg-paprika-600 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  )
}
