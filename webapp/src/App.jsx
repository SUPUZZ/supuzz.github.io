import React from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductsGrid from './components/ProductsGrid'
import Reviews from './components/Reviews'
import Footer from './components/Footer'
import './index.css'

export default function App(){
  return (
    <>
      <Header />
      <main>
        <Hero />
        <section className="trust-section container">
          <div className="trust-item">
            <div className="trust-number">50k+</div>
            <div className="trust-label">Families</div>
          </div>
          <div className="trust-item">
            <div className="trust-number">4.8</div>
            <div className="trust-label">Average Rating</div>
          </div>
          <div className="trust-item">
            <div className="trust-number">10+</div>
            <div className="trust-label">Years of Experience</div>
          </div>
        </section>
        <ProductsGrid />
        <Reviews />
        <div className="container">
          <section className="cta-section">
            <h3 className="cta-title">Ready to give your child a better play experience?</h3>
            <p className="cta-description">High-quality toys and furniture designed for learning and safety.</p>
            <a className="cta-button" href="https://www.amazon.com/stores/Supuzz/page/F8F78FC5-0171-41C7-93DF-ABE20C958710" target="_blank" rel="noreferrer">Shop on Amazon</a>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
