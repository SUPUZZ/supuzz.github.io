import React from 'react'

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-content">
        <div className="product-badge">Best Seller</div>
        <div className="product-name">{product.name}</div>
        <div className="product-description">{product.description}</div>
        <div style={{ marginTop: 12 }}>
          <a className="product-button" href={product.url} target="_blank" rel="noreferrer">Buy on Amazon</a>
        </div>
      </div>
    </div>
  )
}
