import React from 'react'

export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-olive-600">
      <div className="w-8 h-8 border-2 border-olive-200 border-t-paprika-500 rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
