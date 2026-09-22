// Validate the multilingual reader journey and SEO relationships, in source and build output.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { parser } = require('posthtml-parser');
const { locales } = require('./product-localization');
const root = path.resolve(__dirname, '..');
const slugs = ['halloween-toy-gifts-for-kids', 'halloween-boo-basket-ideas-kids', 'non-candy-halloween-gifts-kids', 'halloween-dinosaur-gifts-kids', 'halloween-building-block-activities', 'halloween-classroom-party-gifts'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const nodes = html => {
  const flatten = children => children.flatMap(n => typeof n === 'object' ? [n, ...flatten(n.content || [])] : []);
  return flatten(parser(html));
};
const count = (items, tag) => items.filter(n => n.tag === tag).length;
const value = node => (node.content || []).filter(n => typeof n === 'string').join('');
const sitemap = read('static/sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const httpPaths = new Set(['/css/halloween-guides.css', '/sitemap.xml']);
for (const locale of locales) {
  const dir = locale.directory, titles = new Set(), descriptions = new Set();
  const blog = nodes(read(`${dir}/blog.html`));
  assert.equal(blog.filter(n => n.attrs?.['data-filter'] === 'halloween-gifts').length, 1, `${dir}: filter`);
  assert.equal(blog.filter(n => n.attrs?.['data-category'] === 'halloween-gifts').length, 6, `${dir}: cards`);
  httpPaths.add(`/${dir}/blog.html`);
  for (const slug of slugs) {
    const file = `${dir}/article-${slug}.html`, html = read(file), n = nodes(html);
    const publicUrl = `https://supuzz.com/${file}`;
    const head = n.find(x => x.tag === 'head'), hn = nodes(require('posthtml-render').render(head.content));
    assert(!html.includes('{{'), `${file}: unresolved translation`);
    assert.equal(n.find(x => x.tag === 'html').attrs.lang, locale.htmlLang, file);
    assert.equal(count(n, 'h1'), 1, `${file}: h1`);
    assert.equal(count(n, 'header'), 0, `${file}: local header`);
    assert.equal(count(n, 'include'), 2, `${file}: includes`);
    assert.deepEqual(n.filter(x => x.tag === 'include').map(x => x.attrs.src), ['components/header.html', 'components/footer.html']);
    const title = value(hn.find(x => x.tag === 'title'));
    const meta = name => hn.find(x => x.attrs?.name === name || x.attrs?.property === name)?.attrs.content;
    const description = meta('description');
    assert(title && !titles.has(title), `${file}: unique title`); titles.add(title);
    assert(description && !descriptions.has(description), `${file}: unique description`); descriptions.add(description);
    assert.equal(meta('og:url'), publicUrl);
    assert.equal(meta('twitter:url'), publicUrl);
    assert.equal(meta('og:locale'), locale.ogLocale);
    assert.equal(meta('og:description'), description);
    assert.equal(meta('twitter:description'), description);
    assert(!meta('robots').includes('noindex'));
    const canonical = hn.filter(x => x.attrs?.rel === 'canonical');
    assert.equal(canonical.length, 1); assert.equal(canonical[0].attrs.href, publicUrl);
    const alternate = hn.filter(x => x.attrs?.hreflang);
    assert.equal(alternate.length, 8, `${file}: alternate count`);
    for (const l of locales) assert.equal(alternate.find(x => x.attrs.hreflang === l.directory)?.attrs.href, `https://supuzz.com/${l.directory}/article-${slug}.html`);
    assert.equal(alternate.find(x => x.attrs.hreflang === 'x-default').attrs.href, `https://supuzz.com/en/article-${slug}.html`);
    const schemas = hn.filter(x => x.attrs?.type === 'application/ld+json').map(x => JSON.parse(value(x)));
    const article = schemas.find(x => x['@type'] === 'BlogPosting');
    assert.equal(article.headline, value(n.find(x => x.tag === 'h1')));
    assert.equal(article.inLanguage, locale.htmlLang); assert.equal(article.description, description);
    assert.equal(article.mainEntityOfPage['@id'], publicUrl);
    assert.equal(article.author.url, `https://supuzz.com/${dir}/about.html`);
    assert.equal(article.datePublished.slice(0, 10), n.find(x => x.tag === 'time').attrs.datetime);
    assert.equal(schemas.find(x => x['@type'] === 'BreadcrumbList').itemListElement.at(-1).item, publicUrl);
    assert.equal(sitemapUrls.filter(u => u === publicUrl).length, 1, `${file}: sitemap`);
    assert.equal(blog.filter(x => x.attrs?.href === `article-${slug}.html`).length, 1, `${file}: blog entry`);
    const ids = n.filter(x => x.attrs?.id).map(x => x.attrs.id);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate ids`);
    const bodyNodes = nodes(require('posthtml-render').render(n.find(x => x.tag === 'body').content));
    for (const node of bodyNodes) {
      if (node.tag === 'include') continue;
      for (const attr of ['href', 'src']) {
        const target = node.attrs?.[attr];
        if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
        const [filePart, anchor] = target.split('#');
        if (!filePart) { assert(ids.includes(anchor), `${file}: anchor ${target}`); continue; }
        const local = filePart.startsWith('/') ? path.join(root, 'static', filePart) : path.resolve(root, dir, filePart);
        assert(fs.existsSync(local), `${file}: missing ${target}`);
        if (anchor && filePart.endsWith('.html')) assert(nodes(fs.readFileSync(local, 'utf8')).some(x => x.attrs?.id === anchor), `${file}: target anchor ${target}`);
        if (filePart.endsWith('.html')) assert(path.dirname(local) === path.join(root, dir), `${file}: wrong-language body link`);
      }
    }
    for (const im of bodyNodes.filter(x => x.tag === 'img')) {
      assert(im.attrs.alt && Number(im.attrs.width) > 0 && Number(im.attrs.height) > 0, `${file}: image attributes`);
      httpPaths.add(im.attrs.src);
    }
    if (slug === slugs[0]) for (const p of require('../resource/products-en.json').filter(p => p.asin)) assert(bodyNodes.some(x => x.attrs?.href === `product-${p.slug}.html`), `${file}: missing product ${p.key}`);
    if (dir !== 'en') {
      const articleText = bodyNodes.filter(x => ['p','h2','h3'].includes(x.tag)).map(value).join(' ');
      assert(bodyNodes.filter(x => x.tag === 'h2').length >= 7, `${file}: missing editorial sections`);
      assert(!/Before ordering in the U.S.|More Halloween gift and play ideas|Common questions|Product photo;/.test(articleText), `${file}: untranslated body`);
    }
    if (process.argv.includes('--dist')) {
      const built = nodes(read(`dist/${file}`));
      assert.equal(count(built,'header'),1, `${file}: compiled header`);
      assert.equal(count(built,'footer'),1, `${file}: compiled footer`);
      assert.equal(count(built,'include'),0, `${file}: unresolved includes`);
      assert.equal(built.filter(x => x.attrs?.hreflang).length,8);
      for (const s of built.filter(x => x.attrs?.type === 'application/ld+json')) JSON.parse(value(s));
    }
    httpPaths.add('/' + file);
  }
  console.log(`PASS ${dir}: six complete articles, metadata, reciprocal alternatives, local product links and discovery entries`);
}
async function checkHttp() {
  const baseArg = process.argv.find(x => x.startsWith('--http='));
  if (!baseArg) return;
  const base = baseArg.slice(7);
  await Promise.all([...httpPaths].map(async p => {
    const response = await fetch(base + p);
    assert.equal(response.status,200, `HTTP ${p}`);
    if (p.endsWith('.html')) assert((await response.text()).includes('<html'), `HTML ${p}`);
  }));
  console.log(`PASS HTTP 200: ${httpPaths.size} article, blog, stylesheet, sitemap and image URLs`);
}
checkHttp().catch(error => { console.error(error); process.exitCode = 1; });
