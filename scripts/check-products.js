// Check the published-page contract, including links between real locale files.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { locales } = require('./product-localization');
const catalog = require('../resource/products-en.json').filter(p => !p.storeOnly);
const root = path.resolve(__dirname, '..');
const sitemap = fs.readFileSync(path.join(root, 'static/sitemap.xml'), 'utf8');
const built = process.argv.includes('--dist');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
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
        check(!/View details|Shop on Amazon|Choose your set|Product specifications|What’s included|years|pieces/.test(main), 'no untranslated product UI or units');
      }
    } else {
      const section = html.match(/<section id="products"[\s\S]*?<\/section>/)[0];
      check((section.match(/class="product-card"/g) || []).length === catalog.length, 'all product cards');
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
    }
    checked++;
  }
}
console.log(`Passed ${checked} localized pages: catalog, metadata, reciprocal language links, schemas, images and navigation${built ? ', plus compiled shells' : ''}.`);
