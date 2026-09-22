// Authored translations; only the Halloween cluster and its discovery links are updated.
const fs = require('fs');
const path = require('path');
const { parser } = require('posthtml-parser');
const { locales, localizedCatalog } = require('./product-localization');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(root, file), text.replace(/[ \t]+$/gm, '').trimEnd() + '\n', 'utf8');
const source = require('../resource/products-en.json');
const slugs = ['halloween-toy-gifts-for-kids', 'halloween-boo-basket-ideas-kids', 'non-candy-halloween-gifts-kids', 'halloween-dinosaur-gifts-kids', 'halloween-building-block-activities', 'halloween-classroom-party-gifts'];
const heroKeys = ['dinosaur-l3', 'soft-blocks-l3', 'ocean-l1', 'dinosaur-l2', 'soft-blocks-l3', 'ocean-l2'];
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const url = (locale, slug) => `https://supuzz.com/${locale}/article-${slug}.html`;
const alternatives = slug => [...locales.map(l => ` <link rel="alternate" hreflang="${l.directory}" href="${url(l.directory, slug)}">`), ` <link rel="alternate" hreflang="x-default" href="${url('en', slug)}">`].join('\n');
const flatten = nodes => nodes.flatMap(n => typeof n === 'object' ? [n, ...flatten(n.content || [])] : []);
const imageFor = (directory, p) => {
  const n = flatten(parser(read(`${directory}/product-${p.slug}.html`))).find(n => n.tag === 'img');
  return { ...n.attrs, thumb: n.attrs.src.replace('.webp', '-480.webp') };
};
let sitemap = read('static/sitemap.xml');
for (const locale of locales) {
  const directory = locale.directory;
  if (directory === 'en') {
    for (const slug of slugs) {
      const file = `en/article-${slug}.html`;
      let html = read(file).replace(/\s*<link\b[^>]*hreflang=[^>]*>/g, '');
      html = html.replace('</head>', `${alternatives(slug)}\n</head>`);
      write(file, html);
    }
    continue;
  }
  const data = require(`../resource/halloween-locales/${directory}.cjs`);
  if (data.articles.length !== 6) throw new Error(`Expected six articles: ${directory}`);
  const products = localizedCatalog(source, locale);
  const findProduct = key => { const p = products.find(p => p.key === key); if (!p) throw new Error(key); return p; };
  const card = key => {
    const p = findProduct(key), im = imageFor(directory, p);
    return `<section class="product-pick"><img src="${im.thumb}" width="${im.width}" height="${im.height}" alt="${escape(im.alt)}" loading="lazy" decoding="async"><h3><a href="product-${p.slug}.html">${escape(p.name)}</a></h3><p>${escape(p.facts.join(' · '))}</p><p>${escape(p.cardCopy)}</p>${key === 'soft-blocks-l2' ? `<p class="meta">${escape(locale.copy.waffleNote)}</p>` : ''}<a href="product-${p.slug}.html">${escape(data.details)}</a></section>`;
  };
  const render = html => html.replace(/\{\{p:([^}|]+)(?:\|([^}]+))?\}\}/g, (_, key, label) => {
    const p = findProduct(key); return `<a href="product-${p.slug}.html">${escape(label || p.name)}</a>`;
  }).replace(/\{\{a:(\d+)\}\}/g, (_, i) => `<a href="article-${slugs[i]}.html">${escape(data.articles[i].title)}</a>`)
    .replace(/\{\{cards:([^}]+)\}\}/g, (_, keys) => `<div class="product-picks">${keys.split(',').map(card).join('\n')}</div>`);
  const blogCards = [];
  for (const [i, a] of data.articles.entries()) {
    const slug = slugs[i], pageUrl = url(directory, slug), p = findProduct(heroKeys[i]), im = imageFor(directory, p);
    const english = read(`en/article-${slug}.html`);
    let head = english.slice(english.indexOf('<head>'), english.indexOf('</head>') + 7);
    const enSchema = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
    head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(a.title)} | SUPUZZ</title>`);
    const meta = (attr, name, value) => { head = head.replace(new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(">)`), (_, start, end) => start + escape(value) + end); };
    for (const [attr, name, value] of [
      ['name','description',a.description], ['name','author',data.author], ['property','og:locale',locale.ogLocale],
      ['property','og:url',pageUrl], ['property','og:title',`${a.title} | SUPUZZ`], ['property','og:description',a.description],
      ['property','og:image:alt',im.alt], ['property','article:section',data.category], ['name','twitter:url',pageUrl],
      ['name','twitter:title',a.title], ['name','twitter:description',a.description], ['name','twitter:image:alt',im.alt]
    ]) meta(attr, name, value);
    head = head.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${pageUrl}">`);
    enSchema[0] = { ...enSchema[0], headline: a.title, description: a.description, inLanguage: locale.htmlLang, articleSection: data.category,
      author: { '@type': 'Organization', name: data.author, url: `https://supuzz.com/${directory}/about.html` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl } };
    enSchema[1].itemListElement = [[data.home, `https://supuzz.com/${directory}/index.html`], [data.journal, `https://supuzz.com/${directory}/blog.html`], [a.title, pageUrl]].map(([name,item],j) => ({'@type':'ListItem',position:j+1,name,item}));
    head = head.replace('</head>', enSchema.map(s => `<script type="application/ld+json">${JSON.stringify(s, null, 2)}</script>`).join('\n') + '\n</head>');
    const sectionHtml = a.sections.map(([title, body],j) => `<section aria-labelledby="section-${j}"><h2 id="section-${j}">${escape(title)}</h2>\n${render(body)}\n</section>`).join('\n');
    const related = data.articles.map((b,j) => j === i ? '' : `<li><a href="article-${slugs[j]}.html">${escape(b.title)}</a></li>`).join('\n');
    write(`${directory}/article-${slug}.html`, `<!DOCTYPE html>
<html lang="${locale.htmlLang}">
${head}
<body>
 <include src="components/header.html"></include>
 <main class="container halloween-guide">
 <nav class="breadcrumb" aria-label="${escape(data.breadcrumb)}"><a href="index.html">${escape(data.home)}</a> / <a href="blog.html">${escape(data.journal)}</a> / <span aria-current="page">${escape(data.category)}</span></nav>
 <article class="article-container">
 <div class="article-header"><span class="tag">${escape(data.category)}</span><h1>${escape(a.title)}</h1><p class="meta">${escape(data.author)} · <time datetime="2026-09-22">${escape(data.date)}</time></p></div>
 <figure><img class="featured-img" src="${im.src}" width="${im.width}" height="${im.height}" alt="${escape(im.alt)}" fetchpriority="high" decoding="async"><figcaption>${escape(p.name)}. ${escape(data.caption)}</figcaption></figure>
 <div class="content"><p>${escape(a.intro)}</p>
 <nav class="article-toc" aria-label="${escape(data.contents)}"><strong>${escape(data.contents)}</strong><ol>${a.sections.map(([title],j) => `<li><a href="#section-${j}">${escape(title)}</a></li>`).join('')}<li><a href="#questions">${escape(data.faq)}</a></li></ol></nav>
 ${sectionHtml}
 <section aria-labelledby="shopping"><h2 id="shopping">${escape(data.shoppingTitle)}</h2><p>${escape(data.shopping)}</p></section>
 <section aria-labelledby="questions"><h2 id="questions">${escape(data.faq)}</h2>${a.faq.map(([q,answer]) => `<h3>${escape(q)}</h3><p>${escape(answer)}</p>`).join('\n')}</section>
 <aside aria-labelledby="related"><h2 id="related">${escape(data.related)}</h2><ul>${related}</ul><p><a href="index.html#products">${escape(data.collection)}</a> · <a href="blog.html">${escape(data.back)}</a></p></aside>
 </div></article></main>
 <include src="components/footer.html"></include>
 <script type="module">import { apiService } from '../api/api-service.js'; document.addEventListener('DOMContentLoaded', () => { apiService.pageview(window.location.pathname, document.referrer); });</script>
</body>
</html>
`);
    blogCards.push(`<a href="article-${slug}.html" class="blog-card" data-halloween-article="${slug}" data-category="halloween-gifts" style="text-decoration:none; display:block; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.04);"><div class="blog-img" style="height:180px; overflow:hidden; background:#fff;"><img src="${im.thumb}" width="${im.width}" height="${im.height}" loading="lazy" alt="${escape(im.alt)}" style="object-fit:contain; height:100%; width:100%;"></div><div class="blog-content" style="padding:18px;"><h3 style="font-size:1.1rem; margin-bottom:8px; color:#1C1B1F;">${escape(a.title)}</h3><p style="font-size:.9rem; color:#49454F; margin-bottom:12px;">${escape(a.description)}</p><span class="read-link" style="color:#6750A4; font-weight:500;">${escape(data.read)} →</span></div></a>`);
    if (!sitemap.includes(`<loc>${pageUrl}</loc>`)) sitemap = sitemap.replace('</urlset>', `  <url>\n    <loc>${pageUrl}</loc>\n    <lastmod>2026-09-22</lastmod>\n  </url>\n</urlset>`);
  }
  let blog = read(`${directory}/blog.html`);
  blog = blog.replace(/\n?<!-- halloween-cards:start -->[\s\S]*?<!-- halloween-cards:end -->\n?/g, '');
  blog = blog.replace(/(<div class="blog-grid"[^>]*>)/, `$1\n<!-- halloween-cards:start -->\n${blogCards.join('\n')}\n<!-- halloween-cards:end -->\n`);
  const button = `<button class="filter-btn" data-filter="halloween-gifts" style="padding:8px 18px; border-radius:999px; border:1px solid #CAC4D0; background:#fff; cursor:pointer; font-size:.9rem;">${escape(data.category)}</button>`;
  if (blog.includes('data-filter="halloween-gifts"')) blog = blog.replace(/<button[^>]*data-filter="halloween-gifts"[^>]*>[\s\S]*?<\/button>/, button);
  else blog = blog.replace(/(<button[^>]*data-filter="all"[^>]*>[\s\S]*?<\/button>)/, `$1\n${button}`);
  write(`${directory}/blog.html`, blog);
}
write('static/sitemap.xml', sitemap);
console.log('Updated 36 translated articles, six blog indexes, all 42 reciprocal language clusters and the sitemap.');
