import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import StarRating from '../components/StarRating'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function FoodDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [item, setItem] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [addedMsg, setAddedMsg] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      client.get(`/api/food-items/${id}`),
      client.get(`/api/food-items/${id}/comments`),
    ])
      .then(([itemRes, commentsRes]) => {
        setItem(itemRes.data)
        setComments(commentsRes.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRate = async (stars) => {
    if (!user) return
    setMyRating(stars)
    await client.post(`/api/food-items/${id}/ratings`, { stars })
    load()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setPosting(true)
    try {
      await client.post(`/api/food-items/${id}/comments`, { content: commentText })
      setCommentText('')
      load()
    } finally {
      setPosting(false)
    }
  }

  const handleAddToCart = async () => {
    await addToCart(item.id, 1)
    setAddedMsg('Added to cart!')
    setTimeout(() => setAddedMsg(''), 2000)
  }

  if (loading) return <LoadingSpinner />
  if (!item) return <p className="text-center py-16">Item not found.</p>

  return (
    <div className="max-w-4xl mx-auto px-5 py-12">
      <Link to="/menu" className="text-sm text-olive-600 hover:text-paprika-600">← Back to menu</Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700'}
          alt={item.name}
          className="w-full h-72 object-cover rounded-2xl"
        />

        <div>
          <h1 className="text-3xl font-display font-semibold">{item.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StarRating value={item.average_rating} size={18} />
            <span className="text-sm text-olive-600">
              {item.average_rating > 0 ? item.average_rating.toFixed(1) : 'No ratings yet'}
              {item.rating_count > 0 && ` · ${item.rating_count} rating${item.rating_count > 1 ? 's' : ''}`}
            </span>
          </div>
          <p className="text-olive-700 mt-4">{item.description}</p>
          <p className="text-2xl font-display font-semibold text-paprika-600 mt-4">
            ${item.price.toFixed(2)}
          </p>

          {!item.is_available && (
            <p className="text-sm text-paprika-700 bg-paprika-50 border border-paprika-200 rounded-lg px-3 py-2 mt-3 inline-block">
              Currently unavailable
            </p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              disabled={!item.is_available}
              onClick={user ? handleAddToCart : undefined}
              className="px-6 py-2.5 rounded-full bg-paprika-500 text-ivory font-medium hover:bg-paprika-600 disabled:opacity-50 transition-colors"
            >
              {user ? 'Add to cart' : 'Log in to order'}
            </button>
            {addedMsg && <span className="text-sm text-olive-700">{addedMsg}</span>}
          </div>

          {user && (
            <div className="mt-6">
              <p className="text-sm font-medium text-olive-800 mb-1">Rate this dish</p>
              <StarRating value={myRating} onChange={handleRate} size={22} />
            </div>
          )}
        </div>
      </div>

      <div className="ticket-divider my-10" />

      <div>
        <h2 className="text-xl font-display font-semibold mb-4">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>

        {user ? (
          <form onSubmit={handleComment} className="flex gap-2 mb-6">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts on this dish..."
              className="flex-1 rounded-full border border-olive-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-paprika-400"
            />
            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              className="px-5 py-2 rounded-full bg-olive-800 text-ivory text-sm font-medium hover:bg-olive-900 disabled:opacity-50 transition-colors"
            >
              Post
            </button>
          </form>
        ) : (
          <p className="text-sm text-olive-600 mb-6">
            <Link to="/login" className="text-paprika-600 hover:underline">Log in</Link> to leave a comment.
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-sm text-olive-500">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-white border border-olive-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{c.user_name || 'Customer'}</span>
                  <span className="text-xs text-olive-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-olive-700 mt-1">{c.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
