import React from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating'

export default function FoodCard({ item }) {
  return (
    <Link
      to={`/food/${item.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-olive-100 hover:border-paprika-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative h-44 overflow-hidden bg-olive-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-olive-400 font-display">
            No image
          </div>
        )}
        {!item.is_available && (
          <span className="absolute top-3 left-3 bg-ink/80 text-ivory text-xs font-medium px-2.5 py-1 rounded-full">
            Unavailable
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-ink leading-snug">{item.name}</h3>
          <span className="font-display text-paprika-600 font-semibold whitespace-nowrap">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-olive-700 mt-1 line-clamp-2">{item.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <StarRating value={item.average_rating} size={14} />
          <span className="text-xs text-olive-600">
            {item.average_rating > 0 ? item.average_rating.toFixed(1) : 'No ratings'}
            {item.rating_count > 0 && ` (${item.rating_count})`}
          </span>
        </div>
      </div>
    </Link>
  )
}
