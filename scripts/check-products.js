// Check the published-page contract, including links between real locale files.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { locales } = require('./product-localization');
const catalog = require('../resource/products-en.json').filter(p => !p.storeOnly);
const productOffers = require('../resource/product-offers.json');
const productRatings = require('../resource/product-ratings.json');
const offerTranslations = require('../resource/product-offer-locales.json');
const root = path.resolve(__dirname, '..');
const sitemap = fs.readFileSync(path.join(root, 'static/sitemap.xml'), 'utf8');
const built = process.argv.includes('--dist');
assert.equal(productRatings.source, 'Amazon.com', 'ratings source');
assert(/^\d{4}-\d{2}-\d{2}$/.test(productRatings.checkedAt), 'ratings verification date');
const jsonLd = html => [...html.matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]));
let checked = 0;

for (const locale of locales) {
  const titles = new Set(), descriptions = new Set();
  for (const product of [null, ...catalog]) {
    const file = product ? `product-${product.slug}.html` : 'index.html';
    const relative = `${locale.directory}/${file}`;
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    const url = `https://supuzz.com/${relative}`;
    const check = (condition, label) => assert(condition, `${relative}: ${label}`);
    check(html.includes(`<html lang="${locale.htmlLang}">`), 'HTML language');
    check((html.match(/rel="canonical"/g) || []).length === 1 && html.includes(`rel="canonical" href="${url}"`), 'self canonical');
    check((html.match(/hreflang=/g) || []).length === locales.length + 1, 'complete language alternatives');
    for (const other of locales) {
      check(html.includes(`hreflang="${other.directory}" href="https://supuzz.com/${other.directory}/${file}"`), `alternate ${other.directory}`);
      check(fs.existsSync(path.join(root, other.directory, file)), `alternate file ${other.directory}`);
    }
    check(html.includes(`hreflang="x-default" href="https://supuzz.com/en/${file}"`), 'English fallback');
    check(sitemap.includes(`<loc>${url}</loc>`), 'sitemap entry');
    check(!/content="noindex|product-featured|\bundefined\b/.test(html.replace(/<script\b[\s\S]*?<\/script>/g, '')), 'indexable, uniform, complete content');
    const data = jsonLd(html);
    if (product) {
      check((html.match(/<include /g) || []).length === 2, 'shared shell includes');
      check((html.match(/<h1[\s>]/g) || []).length === 1, 'one H1');
      const title = html.match(/<title>(.*?)<\/title>/)[1];
      const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
      check(!titles.has(title) && !descriptions.has(description), 'unique title and description');
      titles.add(title); descriptions.add(description);
      const graph = data.flatMap(item => item['@graph'] || [item]);
      const entity = graph.find(item => item['@type'] === 'Product');
      check(entity?.identifier.value === product.asin && entity.url === url, 'correct product identity');
      const offer = productOffers.products[product.key];
      check(offer, 'every indexed product requires a verified offer for product snippets');
      check(offer.asin === product.asin && offer.url === `https://www.amazon.com/dp/${product.asin}`, 'offer matches selected variant');
      check(/^\d+\.\d{2}$/.test(offer.price) && Number(offer.price) > 0 && offer.priceCurrency === 'USD', 'verified USD price');
      check(/^\d{4}-\d{2}-\d{2}$/.test(productOffers.checkedAt) && !Number.isNaN(Date.parse(productOffers.checkedAt)), 'offer verification date');
      check(entity.offers?.['@type'] === 'Offer' && entity.offers.url === offer.url && entity.offers.price === Number(offer.price) && entity.offers.priceCurrency === offer.priceCurrency && entity.offers.availability === offer.availability && entity.offers.itemCondition === 'https://schema.org/NewCondition', 'complete product offer schema');
      const rating = productRatings.products[product.key];
      if (rating) {
        check(rating.asin === product.asin && rating.url === offer.url, 'Amazon rating matches product offer');
        check(Number.isFinite(rating.ratingValue) && rating.ratingValue >= 0 && rating.ratingValue <= 5, 'valid Amazon rating value');
        check(Number.isInteger(rating.ratingCount) && rating.ratingCount > 0, 'valid Amazon rating count');
        check(entity.aggregateRating?.['@type'] === 'AggregateRating' && entity.aggregateRating.ratingValue === rating.ratingValue && entity.aggregateRating.ratingCount === rating.ratingCount && entity.aggregateRating.bestRating === productRatings.bestRating && entity.aggregateRating.worstRating === productRatings.worstRating, 'Amazon aggregate rating schema');
        const ratingBlock = html.match(/<p class="product-rating">([\s\S]*?)<\/p>/)?.[0] || '';
        const visibleCount = new Intl.NumberFormat(locale.htmlLang).format(rating.ratingCount);
        check(ratingBlock.includes(rating.ratingValue.toFixed(1)) && ratingBlock.includes(visibleCount) && ratingBlock.includes(rating.url), 'visible Amazon rating with source link');
      } else {
        check(!entity.aggregateRating, 'no aggregateRating without a verified source');
      }
      const note = html.match(/<p class="product-purchase-note">([\s\S]*?)<\/p>/)?.[1] || '';
      const price = new Intl.NumberFormat(locale.htmlLang, {style:'currency', currency:'USD', currencyDisplay:'code'}).format(Number(offer.price));
      const stock = offerTranslations[locale.directory]?.availability[offer.availability];
      check(note.includes(price) && note.includes('USD') && note.includes('Amazon.com') && note.includes(`datetime="${productOffers.checkedAt}"`), 'visible USD price, marketplace and verification date');
      check(stock && note.includes(stock), 'visible localized stock agrees with schema');
      check(note.includes(offerTranslations[locale.directory].disclaimer), 'localized price and delivery explanation');
      check(graph.find(item => item['@type'] === 'WebPage')?.inLanguage === locale.htmlLang, 'schema language');
      const crumbs = graph.find(item => item['@type'] === 'BreadcrumbList');
      check(crumbs.itemListElement.every(item => item.item.startsWith(`https://supuzz.com/${locale.directory}/`)), 'localized breadcrumbs');
      const buy = html.match(/<a href="([^"]+)" class="btn amazon-button"/)[1].replaceAll('&amp;', '&');
      check(buy.includes(`/dp/${product.asin}`), 'matching purchase destination');
      if (product.variantGroup) {
        const variants = html.match(/<div class="product-variants">([\s\S]*?)<\/div>/)[1];
        check((variants.match(/aria-current="page"/g) || []).length === 1, 'one selected variant');
        check((variants.match(/<a /g) || []).length === (product.variantGroup === 'waffle' ? 2 : 3), 'complete variant choices');
      }
      if (locale.directory !== 'en') {
        const main = html.match(/<main[\s\S]*?<\/main>/)[0];
        check(!/View details|Shop on Amazon|Choose your set|Product specifications|What’s included|ratings on Amazon|years|pieces/.test(main), 'no untranslated product UI or units');
      }
    } else {
      const section = html.match(/<section id="products"[\s\S]*?<\/section>/)[0];
      check((section.match(/class="product-card"/g) || []).length === catalog.length, 'all product cards');
      check(!/class="btn amazon-button"|href="https?:\/\//.test(section), 'homepage collection keeps navigation on site');
      check((section.match(/class="btn product-details-button"/g) || []).length === catalog.length, 'every homepage card opens product details');
      check(data.filter(item => item['@type'] === 'ItemList').length === 1, 'one collection schema');
      const list = data.find(item => item['@type'] === 'ItemList');
      check(list.numberOfItems === catalog.length && list.itemListElement.every(item => item.url.startsWith(`https://supuzz.com/${locale.directory}/`)), 'localized collection schema');
      check(html.indexOf('id="products"') < html.indexOf('id="journal"'), 'collection before journal');
    }
    const relevant = product ? html : html.match(/<section id="products"[\s\S]*?<\/section>/)[0];
    for (const match of relevant.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = match[1].split('#')[0];
      if (target.startsWith('/product-images/')) check(fs.existsSync(path.join(root, 'static', target)), `image ${target}`);
      if (/^(?:product-[\w-]+|index)\.html$/.test(target)) check(fs.existsSync(path.join(root, locale.directory, target)), `local link ${target}`);
    }
    if (built) {
      const output = fs.readFileSync(path.join(root, 'dist', relative), 'utf8');
      check((output.match(/<header[\s>]/g) || []).length === 1 && (output.match(/<footer[\s>]/g) || []).length === 1, 'one built header/footer');
      check(!output.includes('<include '), 'resolved includes');
      if (product) {
        const sourceEntity = data.flatMap(item => item['@graph'] || [item]).find(item => item['@type'] === 'Product');
        const outputEntity = jsonLd(output).flatMap(item => item['@graph'] || [item]).find(item => item['@type'] === 'Product');
        assert.deepEqual(outputEntity?.offers, sourceEntity.offers, `${relative}: compiled product offer preserved`);
      }
    }
    checked++;
  }
}
// One shared image browser serves every product. Verify the container and
// the generated language data instead of a separate page per product.
const galleryHtml = fs.readFileSync(path.join(root, 'gallery.html'), 'utf8');
assert(/<meta name="robots" content="noindex, follow">/.test(galleryHtml), 'gallery.html: noindex');
assert(galleryHtml.includes('rel="canonical" href="https://supuzz.com/gallery.html"'), 'gallery.html: self canonical');
assert(galleryHtml.includes('data-gallery-viewer') && !galleryHtml.includes('<include '), 'gallery.html: standalone viewer');
if (built) {
  const output = fs.readFileSync(path.join(root, 'dist', 'gallery.html'), 'utf8');
  assert(output.includes('data-gallery-viewer') && !output.includes('<include '), 'dist/gallery.html: standalone viewer');
}
for (const locale of locales) {
  const relative = `static/data/product-galleries-${locale.directory}.json`;
  const data = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  assert.equal(data.lang, locale.directory, `${relative}: language`);
  assert.equal(data.htmlLang, locale.htmlLang, `${relative}: html language`);
  for (const product of catalog) {
    const entry = data.products[product.key];
    assert(entry, `${relative}: ${product.key}`);
    assert(typeof entry.name === 'string' && entry.name.trim(), `${relative}: ${product.key} name`);
    assert(entry.page === `/${locale.directory}/product-${product.slug}.html`, `${relative}: ${product.key} product page`);
    assert(entry.photos.length === (product.gallery ? product.gallery.length : product.imageAlts.length), `${relative}: ${product.key} photos`);
    for (const photo of entry.photos) {
      assert(typeof photo.alt === 'string' && photo.alt.trim(), `${relative}: ${product.key} alt`);
      assert(fs.existsSync(path.join(root, 'static', photo.file)) && fs.existsSync(path.join(root, 'static', photo.thumb)), `${relative}: ${photo.file}`);
    }
  }
  if (built) assert(fs.existsSync(path.join(root, 'dist', 'data', `product-galleries-${locale.directory}.json`)), `dist data: ${locale.directory}`);
}
// Catch incomplete Product markup in articles and other entry pages as well.
// Ordinary editorial pages should keep their article schema, not a bare Product.
let productEntities = 0;
const schemaRoot = built ? path.join(root, 'dist') : root;
for (const directory of ['', 'static', ...locales.map(locale => locale.directory)]) {
  const folder = path.join(schemaRoot, directory);
  if (!fs.existsSync(folder)) continue;
  for (const filename of fs.readdirSync(folder).filter(file => file.endsWith('.html'))) {
    const relative = path.join(directory, filename);
    // Parcel can leave files from earlier builds with different entry roots.
    // Only audit output corresponding to an actual site entry or static page.
    if (built && !fs.existsSync(path.join(root, relative)) && !fs.existsSync(path.join(root, 'static', relative))) continue;
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      if ([].concat(value['@type'] || []).includes('Product')) {
        productEntities++;
        assert(value.name && (value.offers || value.review || value.aggregateRating), `${relative}: Product requires name and offers, review or aggregateRating`);
        for (const offer of [].concat(value.offers || [])) {
          const price = offer['@type'] === 'AggregateOffer' ? offer.lowPrice : offer.price ?? offer.priceSpecification?.price;
          assert(price !== undefined && price !== null && price !== '' && Number.isFinite(Number(price)) && Number(price) >= 0, `${relative}: product offer requires a numeric price`);
          assert(/^[A-Z]{3}$/.test(offer.priceCurrency || offer.priceSpecification?.priceCurrency), `${relative}: product offer requires an explicit currency`);
        }
      }
      for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
    };
    for (const data of jsonLd(fs.readFileSync(path.join(folder, filename), 'utf8'))) visit(data);
  }
}
console.log(`Audited ${productEntities} Product entities across site HTML: every Product has offers; ${Object.keys(productRatings.products).length} products include Amazon aggregate ratings.`);
console.log(`Passed ${checked} localized pages: catalog, metadata, reciprocal language links, schemas, images and navigation${built ? ', plus compiled shells' : ''}.`);
