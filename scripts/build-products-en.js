// Generate crawlable English product pages from the reviewed catalog.
// Run npm run products:build after editing resource/products-en.json.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const catalog = require('../resource/products-en.json');
const availableCatalog = catalog.filter((product) => !product.storeOnly);
const links = require('../static/data/product-links.json');
const images = require('../resource/product-image-sources-en.json');
const site = 'https://supuzz.com';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const jsonLd = (value) => `<script type="application/ld+json">${JSON.stringify(value, null, 2).replaceAll('<', '\\u003c')}</script>`;
const pageName = (product) => `product-${product.slug}.html`;
const pageUrl = (product) => `${site}/en/${pageName(product)}`;
const productImages = (product) => product.gallery
  ? product.gallery.map(([suffix, alt]) => {
    const image = images.find((item) => item.file === `/product-images/supuzz-${product.slug}-${suffix}.webp`);
    if (!image) throw new Error(`Missing gallery image: ${product.slug}/${suffix}`);
    return { ...image, alt };
  })
  : images.filter((image) => image.key === product.key).map((image, index) => ({ ...image, alt: product.imageAlts[index] }));
const photoFor = (product, suffix) => productImages(product).find((image) => image.file.endsWith(`-${suffix}.webp`));
const amazonUrl = (product) => product.storeOnly ? links.storefrontUrl : (product.amazonUrl || links.products[product.key].url);
const amazonLabel = (product) => product.storeOnly ? 'Visit Amazon Store' : 'Shop on Amazon';

function img(image, alt, { main = false, card = false } = {}) {
  return `<img src="${image.file}" srcset="${image.thumb} 480w, ${image.file} ${image.width}w" sizes="${card ? '(max-width: 600px) 90vw, (max-width: 960px) 44vw, 340px' : '(max-width: 600px) 90vw, 540px'}" alt="${escape(alt)}" width="${image.width}" height="${image.height}" loading="${main ? 'eager' : 'lazy'}"${main ? ' fetchpriority="high"' : ''} decoding="async">`;
}

function amazonButton(product) {
  return `<a href="${escape(amazonUrl(product))}" class="btn amazon-button" target="_blank" rel="noopener noreferrer" aria-label="${amazonLabel(product)}: ${escape(product.name)} (opens in a new tab)">${amazonLabel(product)} <span aria-hidden="true">↗</span></a>`;
}

function card(product, featured = false) {
  return `<article class="product-card${featured ? ' product-featured' : ''}" data-category="${product.category}" data-product-theme="${product.key}">
    <a class="card-img" href="${pageName(product)}" aria-label="View details: ${escape(product.name)}">${featured ? '<span class="product-image-label">THE ORIGINAL WAFFLE COLLECTION</span>' : ''}${img(productImages(product)[0], productImages(product)[0].alt, { card: !featured })}<span class="product-image-arrow" aria-hidden="true">↗</span></a>
    <div class="product-card-body">
      <p class="product-eyebrow">${escape(product.label)}</p>
      <h3><a href="${pageName(product)}">${escape(product.name)}</a></h3>
      <div class="product-card-facts">${product.facts.map(escape).join(' · ')}</div>
      <p class="product-card-copy">${escape(product.cardCopy || product.intro)}</p>
      ${featured ? '<p class="product-feature-line">Connect in different directions.<br>Build a vehicle. Make a character.<br>Pack it all into the included case.</p>' : ''}
      <div class="product-actions"><a href="${pageName(product)}" class="btn product-details-button" aria-label="View details: ${escape(product.name)}">View details <span aria-hidden="true">→</span></a>${amazonButton(product)}</div>
    </div>
  </article>`.replace(/[ \t]+$/gm, '');
}

function featureSections(product) {
  if (!product.features) return `<section class="product-story" id="description"><h2>${escape(product.storyTitle)}</h2>${product.story.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}</section>`;
  return `<section class="product-editorial" id="description" aria-labelledby="description-title">
    <div class="product-section-title"><p class="product-eyebrow">GET TO KNOW THE DETAILS</p><h2 id="description-title">${product.category === 'furniture' ? 'Their place at the table.' : 'More than one way to play.'}</h2></div>
    ${product.features.map((feature, index) => `<div class="product-feature-row${index % 2 ? ' reverse' : ''}"><figure>${img(photoFor(product, feature.image), photoFor(product, feature.image).alt)}<figcaption>${product.category === 'furniture' ? 'Table and accessories shown are sold separately.' : feature.image === 'detail-1' && product.key === 'ocean-l1' || feature.image === 'amazon-3' && product.key === 'ocean-l3' ? 'Mixed collection shown. Additional sets sold separately.' : ''}</figcaption></figure><div class="product-feature-copy"><span class="product-feature-number">0${index + 1}</span><p class="product-eyebrow">${escape(feature.eyebrow)}</p><h3>${escape(feature.title)}</h3><p>${escape(feature.body)}</p><ul>${feature.points.map((point) => `<li>${escape(point)}</li>`).join('')}</ul></div></div>`).join('')}
  </section>
  <section class="product-package" id="in-the-box" aria-labelledby="package-title"><div><p class="product-eyebrow">${product.category === 'furniture' ? 'THE SIZE & THE DETAILS' : 'WHAT’S INCLUDED'}</p><h2 id="package-title">${escape(product.includedTitle)}</h2><ul>${product.included.map((item) => `<li><span aria-hidden="true">✓</span>${escape(item)}</li>`).join('')}</ul></div><figure>${img(photoFor(product, product.packageImage), photoFor(product, product.packageImage).alt)}<figcaption>${escape(product.packageCaption)}</figcaption></figure></section>`;
}

function productPage(product) {
  const photos = productImages(product);
  if (!photos.length) throw new Error(`Missing photos: ${product.key}`);
  const schema = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', '@id': pageUrl(product), url: pageUrl(product), name: product.title, description: product.description, inLanguage: 'en-US', mainEntity: { '@id': `${pageUrl(product)}#product` } },
      { '@type': 'Product', '@id': `${pageUrl(product)}#product`, name: `SUPUZZ ${product.name}`, description: product.description, url: pageUrl(product), image: photos.map((photo) => site + photo.file), brand: { '@type': 'Brand', name: 'SUPUZZ' }, category: product.category === 'furniture' ? 'Kids Chairs' : 'Building Toys', ...(product.asin ? { identifier: { '@type': 'PropertyValue', propertyID: 'ASIN', value: product.asin }, sameAs: `https://www.amazon.com/dp/${product.asin}` } : {}) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/en/index.html` },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${site}/en/index.html#products` },
        { '@type': 'ListItem', position: 3, name: product.name, item: pageUrl(product) }
      ] }
    ]
  };
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(product.title)}</title>
  <meta name="description" content="${escape(product.description)}">
  <meta name="robots" content="${product.storeOnly ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl(product)}">
  <meta property="og:title" content="${escape(product.title)}">
  <meta property="og:description" content="${escape(product.description)}">
  <meta property="og:image" content="${site}${photos[0].file}">
  <meta property="og:image:width" content="${photos[0].width}">
  <meta property="og:image:height" content="${photos[0].height}">
  <meta property="og:image:alt" content="${escape(photos[0].alt)}">
  <meta property="og:site_name" content="SUPUZZ">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${pageUrl(product)}">
  <meta name="twitter:title" content="${escape(product.title)}">
  <meta name="twitter:description" content="${escape(product.description)}">
  <meta name="twitter:image" content="${site}${photos[0].file}">
  <meta name="twitter:image:alt" content="${escape(photos[0].alt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/products-en.css">
  <link rel="icon" href="../images/favicon.ico">
  <meta name="theme-color" content="#6750A4">
  ${jsonLd(schema)}
  <link rel="canonical" href="${pageUrl(product)}">
  <link rel="alternate" hreflang="en" href="${pageUrl(product)}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl(product)}">
</head>
<body class="product-page">
  <include src="components/header.html"></include>
  <main class="product-detail container" data-product-theme="${product.key}">
    <nav class="product-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li><a href="index.html#products">Products</a></li><li aria-current="page">${escape(product.name)}</li></ol></nav>
    <div class="product-overview">
      <div class="product-gallery" data-product-gallery>
        <a class="product-gallery-main" href="${photos[0].file}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size product image">${img(photos[0], photos[0].alt, { main: true })}<span class="product-zoom-label" aria-hidden="true">View full image ↗</span></a>
        ${photos.length > 1 ? `<div class="product-thumbnails" aria-label="Product images">${photos.map((photo, index) => `<a href="${photo.file}" data-gallery-image aria-current="${index === 0}" aria-label="Show product image ${index + 1}"><img src="${photo.thumb}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy"></a>`).join('')}</div>` : ''}
        ${product.category === 'furniture' ? '<p class="product-gallery-hint">Lifestyle photos include tables and accessories sold separately.</p>' : ''}
      </div>
      <div class="product-summary">
        <p class="product-eyebrow">${escape(product.label)}</p>
        <h1>${escape(product.name)}</h1>
        <p class="product-subtitle">${escape(product.subtitle || '')}</p>
        <dl class="product-metrics">${(product.metrics || product.facts.map((fact) => [fact,''])).map(([value,label]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
        <p class="product-intro">${escape(product.intro)}</p>
        ${product.key.startsWith('ocean-') ? `<div class="product-variants"><span>Choose your set</span>${availableCatalog.filter((item) => item.key.startsWith('ocean-')).reverse().map((item) => `<a href="${pageName(item)}" ${item.key === product.key ? 'aria-current="page"' : ''}>${item.key === 'ocean-l1' ? 'L1 · 38 pieces' : 'L3 · 136 pieces'}</a>`).join('')}</div>` : ''}
        <ul class="product-highlights">${product.highlights.map((fact) => `<li>${escape(fact)}</li>`).join('')}</ul>
        <div class="product-actions">${amazonButton(product)}</div>
        <p class="product-purchase-note">${product.storeOnly ? 'Find current garden collections in the SUPUZZ Amazon Store.' : 'Checkout, current pricing and delivery on Amazon.'}</p>
      </div>
    </div>
    <nav class="product-detail-nav" aria-label="Product information"><a href="#description">Explore the product</a>${product.included ? '<a href="#in-the-box">What’s included</a>' : ''}<a href="#specifications">Specifications</a><a href="#questions">FAQs</a></nav>
    ${featureSections(product)}
    <div class="product-information"><section class="product-specs" id="specifications" aria-labelledby="spec-title"><p class="product-eyebrow">THE FACTS AT A GLANCE</p><h2 id="spec-title">Product specifications</h2><dl>${Object.entries(product.specs).map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></section>
    <section class="product-faq" id="questions" aria-labelledby="faq-title"><p class="product-eyebrow">BEFORE YOU CHOOSE</p><h2 id="faq-title">A few useful answers.</h2>${product.faq.map(([question, answer]) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join('')}</section></div>
    <section class="product-collection product-related" aria-labelledby="related-title"><div class="collection-heading"><div><p class="product-eyebrow">THERE’S MORE TO EXPLORE</p><h2 id="related-title">Find their next favorite.</h2></div><a class="product-store-link" href="index.html#products">All products <span aria-hidden="true">↗</span></a></div><div class="grid">${product.related.map((key) => card(catalog.find((item) => item.key === key))).join('\n')}</div></section>
  </main>
  <include src="components/footer.html"></include>
  <script type="module" src="/js/products-en.js"></script>
</body>
</html>
`;
}

for (const product of availableCatalog) fs.writeFileSync(path.join(root, 'en', pageName(product)), productPage(product).replace(/[ \t]+$/gm, ''));

const collection = `<!-- English product collection: generated by scripts/build-products-en.js -->
    <section id="products" class="section product-collection" aria-labelledby="products-title">
      <div class="container">
        <div class="collection-heading"><div><p class="product-eyebrow">THE SUPUZZ COLLECTION / 0${availableCatalog.length} PRODUCTS</p><h2 id="products-title">Build their<br><em>next adventure.</em></h2></div></div>
        <div class="product-filters" data-product-filters aria-label="Filter products" hidden><button type="button" data-filter="all" aria-pressed="true">All products</button><button type="button" data-filter="blocks" aria-pressed="false">Waffle blocks</button><button type="button" data-filter="nature" aria-pressed="false">Nature worlds</button><button type="button" data-filter="furniture" aria-pressed="false">Kids furniture</button></div>
        <p class="product-result-count" data-product-count role="status">${availableCatalog.length} products</p>
        <div class="grid" id="product-grid">${availableCatalog.map((product,index) => card(product,index === 0)).join('\n')}</div>
        <div class="product-store-note"><span>Looking for Rotating Forest or another SUPUZZ set?</span><a class="product-store-link" href="${escape(links.storefrontUrl)}" target="_blank" rel="noopener noreferrer">Explore the Amazon Store ↗</a></div>
      </div>
    </section>
    <!-- End English product collection -->`;
const homePath = path.join(root, 'en', 'index.html');
let home = fs.readFileSync(homePath, 'utf8');
if (home.includes('<!-- English product collection:')) {
  home = home.replace(/<!-- English product collection:[\s\S]*?<!-- End English product collection -->/, collection);
} else {
  home = home.replace(/    <!-- 产品区[^\n]*\n[\s\S]*?<\/section>/, '');
  const marker = '    <!-- 博客预览区 -->';
  if (!home.includes(marker) || home.includes('id="product-grid"')) throw new Error('Unexpected home structure');
  home = home.replace(marker, `    ${collection}\n\n${marker}`);
}
const listSchema = { '@context': 'https://schema.org', '@type': 'ItemList', '@id': `${site}/en/index.html#products`, name: 'SUPUZZ Product Collection', numberOfItems: availableCatalog.length, itemListElement: availableCatalog.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: `SUPUZZ ${product.name}`, url: pageUrl(product) })) };
home = home.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, (script) => /"@type":\s*"(?:Product|ItemList)"/.test(script) ? jsonLd(listSchema) : script);
if (!home.includes('href="../css/products-en.css"')) home = home.replace('<link rel="stylesheet" href="../css/style.css">', '<link rel="stylesheet" href="../css/style.css">\n    <link rel="stylesheet" href="../css/products-en.css">');
if (!home.includes('src="/js/products-en.js"')) home = home.replace('</body>', '    <script type="module" src="/js/products-en.js"></script>\n</body>');
home = home.replace('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no', 'width=device-width, initial-scale=1.0');
home = home.replace('SUPUZZ — Premium Children\'s Building Blocks Wholesale & OEM', 'SUPUZZ Building Blocks & Kids Chairs');
home = home.replace('https://www.amazon.com/dp/B0GD6G6SBT?th=1', escape(links.products['soft-blocks-l3'].url));
fs.writeFileSync(homePath, home);

const sitemapPath = path.join(root, 'static', 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
// The unverified forest listing remains a store fallback, not an indexed product.
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/supuzz.com\/en\/product-rotating-forest.html<\/loc>\s*<\/url>/, '');
const additions = availableCatalog.filter((product) => !sitemap.includes(`<loc>${pageUrl(product)}</loc>`)).map((product) => `  <url>\n    <loc>${pageUrl(product)}</loc>\n  </url>\n`).join('');
fs.writeFileSync(sitemapPath, sitemap.replace('</urlset>', additions + '</urlset>'));
console.log(`Generated ${availableCatalog.length} English product pages, homepage cards and sitemap entries.`);
