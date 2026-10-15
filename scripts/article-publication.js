// Read one authoritative publication date for both homepage and blog cards.
const fs = require('fs');
const labels = {
  en: 'Published ', es: 'Publicado el ', ja: '公開日：', 'zh-Hant': '發布日期：',
  de: 'Veröffentlicht am ', pt: 'Publicado em ', fr: 'Publié le '
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

function publicationMetadata(articlePath, directory) {
  if (!labels[directory]) throw new Error(`Unknown publication locale: ${directory}`);
  const date = publicationDate(articlePath);
  const formatter = new Intl.DateTimeFormat(directory, {year:'numeric', month:'short', day:'numeric', timeZone:'UTC'});
  return { label:labels[directory], date, dateText:formatter.format(new Date(`${date}T12:00:00Z`)) };
}

module.exports = { publicationDate, publicationMetadata };
