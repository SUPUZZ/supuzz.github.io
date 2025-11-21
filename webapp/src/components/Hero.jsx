import React from 'react'

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Play. Learn. Grow — Quality Toys for Kids</h1>
        <p className="hero-subtitle">SUPUZZ makes ergonomic toddler furniture and STEM building toys that help children develop fine motor skills and creativity.</p>
        <div className="hero-buttons">
          <a href="#products" className="btn btn-filled btn-hero-primary">Shop Now</a>
          <a href="/blog.html" className="btn btn-text btn-hero-secondary">Learn More</a>
        </div>
      </div>
    </section>
  )
}
