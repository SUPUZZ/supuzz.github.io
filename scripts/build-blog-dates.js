// Display the linked article's publication date on every localized blog card.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const labels = {
  en: 'Published', es: 'Publicado el', ja: '公開日：', 'zh-Hant': '發布日期：',
  de: 'Veröffentlicht am', pt: 'Publicado em', fr: 'Publié le'
};
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function publicationDate(articlePath) {
  const article = fs.readFileSync(articlePath, 'utf8');
  const dates = new Set();
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some(type => ['BlogPosting', 'Article', 'NewsArticle'].includes(type)) && value.datePublished) dates.add(value.datePublished.slice(0, 10));
    for (const child of Object.values(value)) if (typeof child === 'object') visit(child);
  }
  for (const match of article.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) visit(JSON.parse(match[1]));
  if (dates.size !== 1) throw new Error(`Expected one article publication date: ${articlePath}`);
  const [date] = dates;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new Error(`Invalid publication date: ${articlePath}`);
  return date;
}

for (const [directory, label] of Object.entries(labels)) {
  const pagePath = path.join(root, directory, 'blog.html');
  let page = fs.readFileSync(pagePath, 'utf8');
  const language = page.match(/<html\b[^>]*lang="([^"]+)"/)[1];
  const formatter = new Intl.DateTimeFormat(language, {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'});
  let count = 0;
  page = page.replace(/<a\b(?=[^>]*\bclass="[^"]*\bblog-card\b)[^>]*>[\s\S]*?<\/a>/g, card => {
    const href = card.match(/\bhref="([^"]+)"/)[1];
    if (!/^[\w-]+\.html$/.test(href)) throw new Error(`Expected a local article link: ${directory}/${href}`);
    const date = publicationDate(path.join(root, directory, href));
    const text = formatter.format(new Date(`${date}T12:00:00Z`));
    const separator = /[：:]$/.test(label) ? '' : ' ';
    const markup = `<p class="blog-published"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 11h18"/></svg><span>${escape(label)}${separator}<time datetime="${date}">${escape(text)}</time></span></p>`;
    const cleaned = card.replace(/<p class="blog-published">[\s\S]*?<\/p>/g, '');
    if (!/<h3\b/.test(cleaned)) throw new Error(`Missing card title: ${directory}/${href}`);
    count += 1;
    return cleaned.replace(/<h3\b/, `${markup}<h3`);
  });
  if (!count) throw new Error(`No blog cards found: ${directory}`);
  if (!page.includes('href="../css/blog-list.css"')) page = page.replace('</head>', '    <link rel="stylesheet" href="../css/blog-list.css">\n</head>');
  fs.writeFileSync(pagePath, page);
  console.log(`Added article publication dates to ${count} ${directory} blog cards.`);
}
