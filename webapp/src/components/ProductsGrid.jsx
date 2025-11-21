import React from 'react'
import ProductCard from './ProductCard'

const PRODUCTS = [
  {
    id: 'chair',
    name: 'Ergonomic Toddler Chair',
    image: '/images/toddler-chair.png',
    description: 'Ergonomic toddler chair for ages 1-8 — comfortable and safe.',
    url: 'https://www.amazon.com/dp/B0CT9R3PRQ'
  },
  {
    id: 'reef',
    name: 'Coral Reef Building Toy Set',
    image: '/images/coral-reef.png',
    description: 'Interactive STEM building toy for creative play.',
    url: 'https://www.amazon.com/dp/B0FHK5NP9T'
  },
  {
    id: 'forest',
    name: 'Forest Playset',
    image: '/images/forest-set.png',
    description: 'A soft, imaginative playset for toddlers.',
    url: 'https://www.amazon.com/s?k=SUPUZZ'
  }
]

export default function ProductsGrid() {
  return (
    <section id="products" className="products-section">
      <h2 className="section-title">Featured Products</h2>
      <div className="products-grid">
        {PRODUCTS.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
