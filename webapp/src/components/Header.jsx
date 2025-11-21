import React from 'react'

export default function Header() {
  return (
    <header>
      <div className="nav-wrapper container">
        <a className="logo" href="/">
          <span className="logo-dot">●</span>
          <span className="logo-text">SUPUZZ</span>
        </a>
        <nav className="nav-links">
          <a className="nav-item" href="/blog.html">Blog</a>
          <a className="nav-item" href="#products">Products</a>
          <a className="nav-item" href="/about.html">About</a>
          <a className="nav-item btn-amazon" href="https://www.amazon.com/stores/Supuzz/page/F8F78FC5-0171-41C7-93DF-ABE20C958710" target="_blank" rel="noreferrer">Shop Amazon</a>
        </nav>
      </div>
    </header>
  )
}
