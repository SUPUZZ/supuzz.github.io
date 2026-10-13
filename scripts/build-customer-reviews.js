// Generate crawlable review cards from attributable, curated source data.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const data = require('../resource/amazon-reviews-en.json');
const catalog = require('../resource/products-en.json');
const links = require('../static/data/product-links.json');
const categories = { dinosaurs: 'Dinosaurs', ocean: 'Coral Reef', ice: 'Icy World', blocks: 'Multi-dimensional blocks' };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const dateLabel = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const ids = new Set();
const cards = data.reviews.map(review => {
  const product = catalog.find(item => item.key === review.productKey);
  if (!product || !categories[product.category]) throw new Error(`Unknown review product: ${review.productKey}`);
  if (ids.has(review.id) || review.rating !== 5) throw new Error(`Duplicate or non-five-star review: ${review.id}`);
  ids.add(review.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.date) || !review.author || !review.variation) throw new Error(`Missing review attribution: ${review.id}`);
  const source = new URL(review.url);
  if (source.hostname !== 'www.amazon.com' || !source.pathname.endsWith('/' + review.id)) throw new Error(`Invalid review source: ${review.id}`);
  if (review.verifiedPurchase && review.vine) throw new Error(`Conflicting purchase status: ${review.id}`);
  if (review.contentType !== 'user-provided-full-review' && review.excerpt.split(/\s+/).length > 25) throw new Error(`Review excerpt exceeds limit: ${review.id}`);
  const [suffix, alt] = product.gallery[0];
  const image = `/product-images/supuzz-${product.slug}-${suffix}-480.webp`;
  const localPage = `product-${product.slug}.html`;
  if (!fs.existsSync(path.join(root, 'static', image)) || !fs.existsSync(path.join(root, 'en', localPage))) throw new Error(`Missing review product asset: ${product.key}`);
  const amazon = links.products[product.key]?.url;
  if (!amazon) throw new Error(`Missing purchase link: ${product.key}`);
  const status = review.vine ? 'Amazon Vine · Free product' : review.verifiedPurchase ? 'Verified purchase' : 'Amazon customer review';
  const initials = review.author.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const details = review.fullText
    ? `<details class="review-details"><summary>Read the full review</summary><p class="review-full-text">${escape(review.fullText)}</p></details>`
    : `<details class="review-details"><summary>More about this review</summary><p class="review-summary-label">EDITORIAL SUMMARY</p><p>${escape(review.summary)}</p></details>`;
  return `                <article class="review-card" data-review-category="${product.category}" data-review-id="${escape(review.id)}">
                    <a class="review-product" href="${localPage}" aria-label="Explore ${escape(product.name)}"><span class="review-category">${categories[product.category]}</span><img src="${image}" alt="${escape(alt)}" width="480" height="480" loading="lazy" decoding="async"><span class="review-product-caption"><strong>${escape(product.name)}</strong><span>${escape(product.facts[0])} · Explore set ↗</span></span></a>
                    <div class="review-content">
                        <div class="review-card-top"><span class="review-stars" role="img" aria-label="5 out of 5 stars">★★★★★</span><span class="review-topic">${escape(review.topic)}</span></div>
                        <h3>${escape(review.heading)}</h3><blockquote>“${escape(review.excerpt)}”</blockquote>
                        ${details}
                        <div class="review-author"><span class="review-avatar" aria-hidden="true">${escape(initials)}</span><div><strong>${escape(review.author)}</strong><p><time datetime="${review.date}">${dateLabel(review.date)}</time> · ${escape(review.variation.replace(/^(Color|Number Of Pieces): /, ''))}</p></div></div>
                        <p class="review-status${review.vine ? ' review-status-vine' : ''}">${status}</p>
                        <a class="review-source" href="${escape(review.url)}" target="_blank" rel="noopener noreferrer">Original review on Amazon <span aria-hidden="true">↗</span></a>
                        <a class="review-shop" href="${escape(amazon)}" target="_blank" rel="noopener noreferrer" aria-label="Shop ${escape(product.name)} on Amazon">Shop this set <span aria-hidden="true">↗</span></a>
                    </div>
                </article>`;
});
const filters = [['all', 'All stories'], ...Object.entries(categories)].map(([category, label]) => {
  const count = category === 'all' ? cards.length : data.reviews.filter(review => catalog.find(product => product.key === review.productKey).category === category).length;
  return `<button type="button" data-review-filter="${category}" aria-pressed="${category === 'all'}" aria-controls="review-track">${label}<span>${count}</span></button>`;
}).join('\n                ');
const section = `    <!-- Customer reviews: generated by scripts/build-customer-reviews.js -->
    <section class="section customer-reviews" aria-labelledby="customer-reviews-title">
        <div class="container">
            <div class="reviews-heading">
                <div><p class="product-eyebrow">REAL PLAY. IN THEIR WORDS.</p><h2 id="customer-reviews-title">Little builds.<br><em>Real stories.</em></h2><p class="reviews-intro">Discover how families build, share and play with SUPUZZ.</p></div>
                <div class="reviews-provenance"><span class="review-stars" role="img" aria-label="Selected five-star reviews">★★★★★</span><strong>${cards.length} selected five-star reviews</strong><span>From Amazon customers · Source linked on every card</span></div>
            </div>
            <div class="reviews-toolbar"><div class="review-filters" role="group" aria-label="Filter reviews by collection" hidden>${filters}</div><div class="review-controls" hidden><button type="button" data-review-prev aria-label="Previous customer review" aria-controls="review-track">←</button><button type="button" data-review-next aria-label="Next customer review" aria-controls="review-track">→</button></div></div>
            <div class="review-track" id="review-track" tabindex="0" role="region" aria-label="Customer reviews; scroll horizontally to browse">
${cards.join('\n')}
            </div>
            <div class="reviews-footer"><p><span data-review-count role="status" aria-live="polite">${cards.length} stories</span> · Swipe or use the arrows to explore</p><p>Selected reviews, not an overall rating. Expand for full reviews or labeled editorial summaries. Vine reviewers received a free product. Checked ${dateLabel(data.checkedAt)}.</p></div>
        </div>
    </section>
    <!-- End customer reviews -->`;
const homepage = path.join(root, 'en/index.html');
const original = fs.readFileSync(homepage, 'utf8');
const pattern = /    <!-- (?:Selected excerpts captured from Amazon[^\n]*|Customer reviews: generated[^\n]*) -->[\s\S]*?<\/section>(?:\r?\n    <!-- End customer reviews -->)?/;
if (!pattern.test(original)) throw new Error('Homepage review section marker not found');
fs.writeFileSync(homepage, original.replace(pattern, section));
console.log(`Rendered ${cards.length} attributed reviews across ${Object.keys(categories).length} collections.`);
