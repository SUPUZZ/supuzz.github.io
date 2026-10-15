// Display the linked article's publication date on every localized blog card.
const fs = require('fs');
const path = require('path');
const { blogCardInclude } = require('./blog-card');
const root = path.resolve(__dirname, '..');
const labels = {
  en: 'Published', es: 'Publicado el', ja: '公開日：', 'zh-Hant': '發布日期：',
  de: 'Veröffentlicht am', pt: 'Publicado em', fr: 'Publié le'
};

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
  page = page.replace(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g, (include, json) => {
    const card = JSON.parse(json);
    const { href } = card;
    if (!/^[\w-]+\.html$/.test(href)) throw new Error(`Expected a local article link: ${directory}/${href}`);
    const date = publicationDate(path.join(root, directory, href));
    const text = formatter.format(new Date(`${date}T12:00:00Z`));
    const separator = /[：:]$/.test(label) ? '' : ' ';
    count += 1;
    return blogCardInclude({ ...card, label:label + separator, date, dateText:text });
  });
  if (!count) throw new Error(`No blog cards found: ${directory}`);
  if (!page.includes('href="../css/blog-list.css"')) page = page.replace('</head>', '    <link rel="stylesheet" href="../css/blog-list.css">\n</head>');
  fs.writeFileSync(pagePath, page);
  console.log(`Added article publication dates to ${count} ${directory} blog cards.`);
}
