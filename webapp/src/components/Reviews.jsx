import React from 'react'

const REVIEWS = [
  { id: 1, stars: '★★★★★', text: 'Amazing quality — my kid loves it!', author: 'Jane D.' },
  { id: 2, stars: '★★★★★', text: 'Great STEM toy, very engaging.', author: 'Mark T.' },
  { id: 3, stars: '★★★★☆', text: 'Good value and durable.', author: 'A. Kim' }
]

export default function Reviews() {
  return (
    <section className="reviews-section">
      <h2 className="section-title">Customer Reviews</h2>
      <div className="reviews-grid">
        {REVIEWS.map(r => (
          <div key={r.id} className="review-card">
            <div className="review-stars">{r.stars}</div>
            <div className="review-text">“{r.text}”</div>
            <div className="review-author">{r.author}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
