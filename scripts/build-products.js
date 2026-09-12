// Generate crawlable product pages and collections for every supported locale.
// Run npm run products:build after editing resource/products-en.json.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const sourceCatalog = require('../resource/products-en.json');
const { locales, localizedCatalog } = require('./product-localization');
for (const locale of locales) generateLocale(locale);

function generateLocale(locale) {
  const catalog = localizedCatalog(sourceCatalog, locale);
  const t = (text) => locale.ui?.[text] || text;
  const localizeUi = (html) => html.replace(/>([^<>]*)</g, (match, text) => {
    const value = text.trim();
    const translated = escape(t(value));
    return '>' + (locale.directory === 'en' || !locale.ui[value] ? text : text.replace(value, translated)) + '<';
  }).replace(/aria-label="([^"]*)"/g, (match, value) => {
    let translated = t(value);
    for (const prefix of ['View details', 'Shop on Amazon', 'Show product image']) {
      if (value.startsWith(prefix)) translated = t(prefix) + value.slice(prefix.length);
    }
    // Names were already escaped by the card renderer. Decode those entities
    // before escaping the complete translated accessible label exactly once.
    translated = translated.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    return 'aria-label="' + escape(translated.replace('(opens in a new tab)', '(' + t('opens in a new tab') + ')')) + '"';
  });
  const availableCatalog = catalog.filter((product) => !product.storeOnly);
  const links = require('../static/data/product-links.json');
  const images = require('../resource/product-image-sources-en.json');
  const site = 'https://supuzz.com';
  const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const jsonLd = (value) => `<script type="application/ld+json">${JSON.stringify(value, null, 2).replaceAll('<', '\\u003c')}</script>`;
  const pageName = (product) => `product-${product.slug}.html`;
  const pageUrl = (product) => `${site}/${locale.directory}/${pageName(product)}`;
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

  function variantChoices(product) {
    if (!product.variantGroup) return '';
    const variants = availableCatalog.filter((item) => item.variantGroup === product.variantGroup)
      .sort((left, right) => left.variantOrder - right.variantOrder);
    return `<div class="product-variants"><span>Choose your set</span>${variants.map((item) => `<a href="${pageName(item)}" ${item.key === product.key ? 'aria-current="page"' : ''}>${escape(item.variantLabel)}</a>`).join('')}</div>`;
  }

  function card(product) {
    return `<article class="product-card" data-category="${product.category}" data-product-theme="${product.key}">
      <a class="card-img" href="${pageName(product)}" aria-label="View details: ${escape(product.name)}">${img(productImages(product)[0], productImages(product)[0].alt, { card: true })}<span class="product-image-arrow" aria-hidden="true">↗</span></a>
      <div class="product-card-body">
        <p class="product-eyebrow">${escape(product.label)}</p>
        <h3><a href="${pageName(product)}">${escape(product.name)}</a></h3>
        <div class="product-card-facts">${product.facts.map(escape).join(' · ')}</div>
        <p class="product-card-copy">${escape(product.cardCopy || product.intro)}</p>
        <div class="product-actions"><a href="${pageName(product)}" class="btn product-details-button" aria-label="View details: ${escape(product.name)}">View details <span aria-hidden="true">→</span></a>${amazonButton(product)}</div>
      </div>
    </article>`.replace(/[ \t]+$/gm, '');
  }

  function featureSections(product) {
    if (!product.features) return `<section class="product-story" id="description"><h2>${escape(product.storyTitle)}</h2>${product.story.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')}</section>`;
    return `<section class="product-editorial" id="description" aria-labelledby="description-title">
      <div class="product-section-title"><p class="product-eyebrow">GET TO KNOW THE DETAILS</p><h2 id="description-title">${product.category === 'furniture' ? 'Their place at the table.' : 'More than one way to play.'}</h2></div>
      ${product.features.map((feature, index) => `<div class="product-feature-row${index % 2 ? ' reverse' : ''}"><figure>${img(photoFor(product, feature.image), photoFor(product, feature.image).alt)}<figcaption>${feature.caption ? escape(feature.caption) : product.category === 'furniture' ? 'Table and accessories shown are sold separately.' : feature.image === 'detail-1' && product.key === 'ocean-l1' || feature.image === 'amazon-3' && product.key === 'ocean-l3' ? 'Mixed collection shown. Additional sets sold separately.' : ''}</figcaption></figure><div class="product-feature-copy"><span class="product-feature-number">0${index + 1}</span><p class="product-eyebrow">${escape(feature.eyebrow)}</p><h3>${escape(feature.title)}</h3><p>${escape(feature.body)}</p><ul>${feature.points.map((point) => `<li>${escape(point)}</li>`).join('')}</ul></div></div>`).join('')}
    </section>
    <section class="product-package" id="in-the-box" aria-labelledby="package-title"><div><p class="product-eyebrow">${product.category === 'furniture' ? 'THE SIZE & THE DETAILS' : 'WHAT’S INCLUDED'}</p><h2 id="package-title">${escape(product.includedTitle)}</h2><ul>${product.included.map((item) => `<li><span aria-hidden="true">✓</span>${escape(item)}</li>`).join('')}</ul></div><figure>${img(photoFor(product, product.packageImage), photoFor(product, product.packageImage).alt)}<figcaption>${escape(product.packageCaption)}</figcaption></figure></section>`;
  }

  function productPage(product) {
    const photos = productImages(product);
    if (!photos.length) throw new Error(`Missing photos: ${product.key}`);
    const schema = {
      '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebPage', '@id': pageUrl(product), url: pageUrl(product), name: product.title, description: product.description, inLanguage: locale.htmlLang, mainEntity: { '@id': `${pageUrl(product)}#product` } },
        { '@type': 'Product', '@id': `${pageUrl(product)}#product`, name: `SUPUZZ ${product.name}`, description: product.description, url: pageUrl(product), image: photos.map((photo) => site + photo.file), brand: { '@type': 'Brand', name: 'SUPUZZ' }, category: t(product.category === 'furniture' ? 'Kids Chairs' : 'Building Toys'), ...(product.asin ? { identifier: { '@type': 'PropertyValue', propertyID: 'ASIN', value: product.asin }, sameAs: `https://www.amazon.com/dp/${product.asin}` } : {}) },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('Home'), item: `${site}/${locale.directory}/index.html` },
          { '@type': 'ListItem', position: 2, name: t('Products'), item: `${site}/${locale.directory}/index.html#products` },
          { '@type': 'ListItem', position: 3, name: product.name, item: pageUrl(product) }
        ] }
      ]
    };
    return `<!DOCTYPE html>
  <html lang="${locale.htmlLang}">
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
    <meta property="og:locale" content="${locale.ogLocale}">
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
    ${alternates(pageName(product))}
  </head>
  <body class="product-page">
    <include src="components/header.html"></include>
    <main class="product-detail container" data-product-theme="${product.key}">
      <nav class="product-breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li><a href="index.html#products">Products</a></li><li aria-current="page">${escape(product.name)}</li></ol></nav>
      <div class="product-overview">
        <div class="product-gallery" data-product-gallery>
          <a class="product-gallery-main" href="${photos[0].file}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size product image">${img(photos[0], photos[0].alt, { main: true })}<span class="product-zoom-label" aria-hidden="true">View full image ↗</span></a>
          ${photos.length > 1 ? `<div class="product-thumbnails" aria-label="Product images">${photos.map((photo, index) => `<a href="${photo.file}" data-gallery-image aria-current="${index === 0}" aria-label="Show product image ${index + 1}"><img src="${photo.thumb}" alt="${escape(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy"></a>`).join('')}</div>` : ''}
          ${product.galleryNote ? `<p class="product-gallery-hint">${escape(product.galleryNote)}</p>` : product.category === 'furniture' ? '<p class="product-gallery-hint">Lifestyle photos include tables and accessories sold separately.</p>' : ''}
        </div>
        <div class="product-summary">
          <p class="product-eyebrow">${escape(product.label)}</p>
          <h1>${escape(product.name)}</h1>
          <p class="product-subtitle">${escape(product.subtitle || '')}</p>
          <dl class="product-metrics">${(product.metrics || product.facts.map((fact) => [fact,''])).map(([value,label]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
          <p class="product-intro">${escape(product.intro)}</p>
          ${variantChoices(product)}
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

  function alternates(filename) {
    return [...locales.map(item => `<link rel="alternate" hreflang="${item.directory}" href="${site}/${item.directory}/${filename}">`), `<link rel="alternate" hreflang="x-default" href="${site}/en/${filename}">`].join('\n  ');
  }
  for (const product of availableCatalog) fs.writeFileSync(path.join(root, locale.directory, pageName(product)), localizeUi(productPage(product)).replace(/[ \t]+$/gm, ''));

  const collection = `<!-- Localized product collection: generated by scripts/build-products.js -->
      <section id="products" class="section product-collection" aria-labelledby="products-title">
        <div class="container">
          <div class="collection-heading"><div><p class="product-eyebrow">${t('THE SUPUZZ COLLECTION')} / ${availableCatalog.length} ${t('products')}</p><h2 id="products-title">Build their<br><em>next adventure.</em></h2></div></div>
          <div class="product-filters" data-product-filters aria-label="Filter products" hidden><button type="button" data-filter="all" aria-pressed="true">All products</button><button type="button" data-filter="blocks" aria-pressed="false">Waffle blocks</button><button type="button" data-filter="ocean" aria-pressed="false">Coral Reef</button><button type="button" data-filter="ice" aria-pressed="false">Icy World</button><button type="button" data-filter="dinosaurs" aria-pressed="false">Dinosaurs</button><button type="button" data-filter="furniture" aria-pressed="false">Kids furniture</button></div>
          <p class="product-result-count" data-product-count data-singular="${escape(t('product'))}" data-plural="${escape(t('products'))}" role="status">${availableCatalog.length} ${t('products')}</p>
          <div class="grid" id="product-grid">${availableCatalog.map((product) => card(product)).join('\n')}</div>
          <div class="product-store-note"><span>Looking for Rotating Forest or another SUPUZZ set?</span><a class="product-store-link" href="${escape(links.storefrontUrl)}" target="_blank" rel="noopener noreferrer">Explore the Amazon Store ↗</a></div>
        </div>
      </section>
      <!-- End Localized product collection -->`;
  const homePath = path.join(root, locale.directory, 'index.html');
  let home = fs.readFileSync(homePath, 'utf8');
  if (/<!-- (?:English|Localized) product collection:/.test(home)) {
    home = home.replace(/<!-- (?:English|Localized) product collection:[\s\S]*?<!-- End (?:English|Localized) product collection -->/, localizeUi(collection));
  } else {
    const section = /<section id="products"[^>]*>[\s\S]*?<\/section>/;
    if (!section.test(home)) throw new Error('Missing product section: ' + locale.directory);
    home = home.replace(section, localizeUi(collection));
  }
  // Match the English homepage: place the collection directly after the hero.
  if (home.indexOf('id="products"') > home.indexOf('id="journal"') && home.includes('id="journal"')) {
    home = home.replace(/\s*<!-- Localized product collection:[\s\S]*?<!-- End Localized product collection -->/, '');
    home = home.replace(/(<section id="home"[\s\S]*?<\/section>)/, '$1\n\n    ' + localizeUi(collection));
  }
  const listSchema = { '@context': 'https://schema.org', '@type': 'ItemList', '@id': `${site}/${locale.directory}/index.html#products`, name: t('THE SUPUZZ COLLECTION'), inLanguage: locale.htmlLang, numberOfItems: availableCatalog.length, itemListElement: availableCatalog.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: `SUPUZZ ${product.name}`, url: pageUrl(product) })) };
  home = home.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, (script) => {
    const data = JSON.parse(script.replace(/<[^>]+>/g, ''));
    if (['Product', 'ItemList'].includes(data['@type'])) return '';
    if (['Organization','WebPage'].includes(data['@type'])) { data.description = locale.homeDescription; if(data['@type']==='WebPage') { data.name = locale.homeTitle; data.inLanguage = locale.htmlLang; } }
    if (data['@type']==='WebSite') delete data.potentialAction;
    return '\n' + jsonLd(data);
  });
  home = home.replace('</head>', jsonLd(listSchema) + '\n</head>');
  home = home.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escape(locale.homeTitle) + '</title>');
  const homeMeta = { description:locale.homeDescription, 'og:title':locale.homeTitle, 'og:description':locale.homeDescription, 'twitter:title':locale.homeTitle, 'twitter:description':locale.homeDescription, 'og:image':site + productImages(availableCatalog[0])[0].file, 'twitter:image':site + productImages(availableCatalog[0])[0].file, 'og:image:width':String(productImages(availableCatalog[0])[0].width), 'og:image:height':String(productImages(availableCatalog[0])[0].height), 'og:locale':locale.ogLocale, 'og:image:alt':locale.homeTitle, 'twitter:image:alt':locale.homeTitle };
  home = home.replace(/<meta\b[^>]*>/g, tag => { const key=tag.match(/(?:name|property)="([^"]+)"/)?.[1]; return Object.hasOwn(homeMeta,key) ? tag.replace(/content="[^"]*"/, 'content="' + escape(homeMeta[key]) + '"') : tag; });
  home = home.replace(/\s*<link\b[^>]*(?:rel="canonical"|hreflang=)[^>]*>/g, '');
  home = home.replace('</head>', '<link rel="canonical" href="' + site + '/' + locale.directory + '/index.html">\n' + alternates('index.html') + '\n</head>');
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
  console.log(`Generated ${availableCatalog.length} ${locale.directory} product pages, collection and sitemap entries.`);
}
