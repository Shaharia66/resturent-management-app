import React from 'react'

export default function StarRating({ value = 0, onChange = null, size = 18 }) {
  const stars = [1, 2, 3, 4, 5]
  const interactive = typeof onChange === 'function'

  return (
    <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label="rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= Math.round(value) ? '#d4a017' : 'none'}
            stroke="#d4a017"
            strokeWidth="1.5"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  )
}
