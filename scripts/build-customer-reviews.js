// Generate crawlable review cards from attributable, curated source data.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const data = require('../resource/amazon-reviews-en.json');
const sourceCatalog = require('../resource/products-en.json');
const translations = require('../resource/homepage-locales.json');
const { locales, localizedCatalog } = require('./product-localization');
const english = {
  eyebrow:'REAL PLAY. IN THEIR WORDS.', title:'Little builds.', accent:'Real stories.',
  intro:'Discover how families build, share and play with SUPUZZ.', selected:'13 selected five-star reviews',
  provenance:'From Amazon customers · Source linked on every card', all:'All stories', filter:'Filter reviews by collection',
  region:'Customer reviews; swipe or scroll horizontally to browse', stars:'5 out of 5 stars',
  full:'Read the full review', summary:'More about this review', summaryLabel:'EDITORIAL SUMMARY',
  verified:'Verified purchase', vine:'Amazon Vine · Free product', customer:'Amazon customer review',
  source:'View original review on Amazon', swipe:'Swipe to explore', previous:'Previous customer review', next:'Next customer review',
  footer:'Selected reviews, not an overall rating. Expand for full reviews or labeled editorial summaries. Vine reviewers received a free product. Checked {date}.'
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const locale of locales) {
const directory = locale.directory;
const copy = translations[directory]?.reviews || english;
const translated = translations[directory]?.quotes;
const quotes = new Map(translated?.map(([id, topic, heading, excerpt]) => [id, {topic, heading, excerpt}]));
if (translated && (quotes.size !== data.reviews.length || translated.length !== quotes.size)) throw new Error(`Review translation count: ${directory}`);
const catalog = localizedCatalog(sourceCatalog, locale);
const categories = Object.fromEntries(Object.entries({ dinosaurs:'Dinosaurs', ocean:'Coral Reef', ice:'Icy World', blocks:'Waffle blocks' }).map(([key,label]) => [key, locale.ui?.[label] || label]));
const dateLabel = value => new Intl.DateTimeFormat(locale.htmlLang, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
const ids = new Set();
const cards = data.reviews.map(review => {
  const text = translated ? quotes.get(review.id) : review;
  if (!text?.topic || !text.heading || !text.excerpt) throw new Error(`Missing review translation: ${directory}/${review.id}`);
  const product = catalog.find(item => item.key === review.productKey);
  if (!product || !categories[product.category]) throw new Error(`Unknown review product: ${review.productKey}`);
  if (ids.has(review.id) || review.rating !== 5) throw new Error(`Duplicate or non-five-star review: ${review.id}`);
  ids.add(review.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.date) || !review.author || !review.variation) throw new Error(`Missing review attribution: ${review.id}`);
  const source = new URL(review.url);
  if (source.hostname !== 'www.amazon.com' || !source.pathname.endsWith('/' + review.id)) throw new Error(`Invalid review source: ${review.id}`);
  if (review.verifiedPurchase && review.vine) throw new Error(`Conflicting purchase status: ${review.id}`);
  if (review.contentType !== 'user-provided-full-review' && review.excerpt.split(/\s+/).length > 25) throw new Error(`Review excerpt exceeds limit: ${review.id}`);
  const status = review.vine ? copy.vine : review.verifiedPurchase ? copy.verified : copy.customer;
  const initials = review.author.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const details = review.fullText
    ? `<details class="review-details"><summary>${escape(copy.full)}</summary><p class="review-full-text"${translated ? ' lang="en"' : ''}>${escape(review.fullText)}</p></details>`
    : `<details class="review-details"><summary>${escape(copy.summary)}</summary><p class="review-summary-label">${escape(copy.summaryLabel)}</p><p${translated ? ' lang="en"' : ''}>${escape(review.summary)}</p></details>`;
  return `                <article class="review-card" data-review-category="${product.category}" data-review-id="${escape(review.id)}">
                    <div class="review-content">
                        <div class="review-card-top"><span class="review-stars" role="img" aria-label="${escape(copy.stars)}">★★★★★</span><span class="review-topic">${escape(text.topic)}</span></div>
                        <span class="review-quote-mark" aria-hidden="true">“</span>
                        <h3>${escape(text.heading)}</h3><blockquote>“${escape(text.excerpt)}”</blockquote>${translated ? `<p class="review-translation">${escape(copy.translated)}</p>` : ''}
                        ${details}
                        <div class="review-attribution">
                        <div class="review-author"><span class="review-avatar" aria-hidden="true">${escape(initials)}</span><div><strong>${escape(review.author)}</strong><p><time datetime="${review.date}">${dateLabel(review.date)}</time> · ${escape(review.variation.replace(/^(Color|Number Of Pieces): /, ''))}</p></div></div>
                        <p class="review-status${review.vine ? ' review-status-vine' : ''}">${status}</p>
                        </div>
                        <div class="review-product"><span class="review-product-caption"><span class="review-category">${categories[product.category]}</span><strong>${escape(product.name)}</strong></span></div>
                        <a class="review-source" href="${escape(review.url)}" target="_blank" rel="noopener noreferrer">${escape(copy.source)} <span aria-hidden="true">↗</span></a>
                    </div>
                </article>`;
});
const filters = [['all', copy.all], ...Object.entries(categories)].map(([category, label]) => {
  const count = category === 'all' ? cards.length : data.reviews.filter(review => catalog.find(product => product.key === review.productKey).category === category).length;
  return `<button type="button" data-review-filter="${category}" aria-pressed="${category === 'all'}" aria-controls="review-track">${label}<span>${count}</span></button>`;
}).join('\n                ');
const section = `    <!-- Customer reviews: generated by scripts/build-customer-reviews.js -->
    <section class="section customer-reviews" aria-labelledby="customer-reviews-title">
        <div class="container">
            <div class="reviews-heading">
                <div><p class="product-eyebrow">${escape(copy.eyebrow)}</p><h2 id="customer-reviews-title">${escape(copy.title)}<br><em>${escape(copy.accent)}</em></h2><p class="reviews-intro">${escape(copy.intro)}</p></div>
                <div class="reviews-provenance"><span class="review-stars" role="img" aria-label="${escape(copy.selected)}">★★★★★</span><strong>${escape(copy.selected.replace('13', cards.length))}</strong><span>${escape(copy.provenance)}</span></div>
            </div>
            <div class="review-filters" role="group" aria-label="${escape(copy.filter)}" hidden>${filters}</div>
            <div class="review-track" id="review-track" tabindex="0" role="region" aria-label="${escape(copy.region)}">
${cards.join('\n')}
            </div>
            <div class="reviews-navigation" hidden>
                <span class="review-position" data-review-position role="status" aria-live="polite" aria-atomic="true"></span>
                <span class="review-progress" aria-hidden="true"><span class="review-progress-thumb"></span></span>
                <span class="review-swipe-hint">${escape(copy.swipe)}</span>
                <div class="review-controls"><button type="button" data-review-prev aria-label="${escape(copy.previous)}" aria-controls="review-track">←</button><button type="button" data-review-next aria-label="${escape(copy.next)}" aria-controls="review-track">→</button></div>
            </div>
            <div class="reviews-footer"><p>${escape(copy.footer.replace('{date}', dateLabel(data.checkedAt)))}</p></div>
        </div>
    </section>
    <!-- End customer reviews -->`;
const homepage = path.join(root, directory, 'index.html');
const original = fs.readFileSync(homepage, 'utf8');
const pattern = /    <!-- (?:Selected excerpts captured from Amazon[^\n]*|Customer reviews: generated[^\n]*) -->[\s\S]*?<\/section>(?:\r?\n    <!-- End customer reviews -->)?/;
let home;
if (pattern.test(original)) home = original.replace(pattern, section);
else {
  const journal = original.match(/    <!-- Homepage journal: generated[^\n]* -->|    <div class="container" id="journal">/);
  if (!journal) throw new Error(`Homepage review insertion point not found: ${directory}`);
  home = original.slice(0, journal.index) + section + '\n\n' + original.slice(journal.index);
}
fs.writeFileSync(homepage, home);
console.log(`Rendered ${cards.length} attributed reviews for ${directory}.`);
}
