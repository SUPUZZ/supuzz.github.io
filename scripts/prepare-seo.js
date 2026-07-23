const fs = require('fs');
const path = require('path');

const siteUrl = 'https://supuzz.com';
const rootDir = path.resolve(__dirname, '..');
const locales = [
  { directory: 'en', hreflang: 'en', htmlLang: 'en-US' },
  { directory: 'es', hreflang: 'es', htmlLang: 'es-ES' },
  { directory: 'ja', hreflang: 'ja', htmlLang: 'ja-JP' },
  { directory: 'zh-Hant', hreflang: 'zh-Hant', htmlLang: 'zh-Hant' },
  { directory: 'de', hreflang: 'de', htmlLang: 'de' },
  { directory: 'pt', hreflang: 'pt', htmlLang: 'pt' },
  { directory: 'fr', hreflang: 'fr', htmlLang: 'fr' }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pageUrl(locale, fileName) {
  return `${siteUrl}/${locale.directory}/${fileName}`;
}

function updateHtmlLanguage(html, language) {
  return html.replace(/<html\b([^>]*)>/i, (match, attributes) => {
    if (/\blang\s*=/i.test(attributes)) {
      return `<html${attributes.replace(/\blang\s*=\s*(["'])[^"']*\1/i, `lang="${language}"`)}>`;
    }
    return `<html${attributes} lang="${language}">`;
  });
}

function upsertMeta(html, attribute, value, content) {
  const matcher = new RegExp(`\\b${attribute}\\s*=\\s*(["'])${escapeRegExp(value)}\\1`, 'i');
  let found = false;
  const updated = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (!matcher.test(tag)) return tag;
    found = true;
    if (/\bcontent\s*=/i.test(tag)) {
      return tag.replace(/\bcontent\s*=\s*(["'])[^"']*\1/i, `content="${content}"`);
    }
    return tag.replace(/\/?\s*>$/, ` content="${content}">`);
  });

  if (found) return updated;
  return updated.replace(/<\/head>/i, `    <meta ${attribute}="${value}" content="${content}">\n</head>`);
}

function alternateLinks(fileName, pageSets) {
  const links = locales
    .filter((locale) => pageSets.get(locale.directory).has(fileName))
    .map((locale) => `    <link rel="alternate" hreflang="${locale.hreflang}" href="${pageUrl(locale, fileName)}">`);
  const english = locales[0];
  const fallback = pageSets.get(english.directory).has(fileName)
    ? pageUrl(english, fileName)
    : pageUrl(locales.find((locale) => pageSets.get(locale.directory).has(fileName)), fileName);
  links.push(`    <link rel="alternate" hreflang="x-default" href="${fallback}">`);
  return links.join('\n');
}

function normalizePage(filePath, locale, fileName, pageSets) {
  const canonical = pageUrl(locale, fileName);
  let html = fs.readFileSync(filePath, 'utf8');

  html = updateHtmlLanguage(html, locale.htmlLang);
  html = html.replace(/\s*<link\b(?=[^>]*\brel\s*=\s*(["'])canonical\1)[^>]*>/gi, '');
  html = html.replace(/\s*<link\b(?=[^>]*\bhreflang\s*=)[^>]*>/gi, '');
  html = upsertMeta(html, 'property', 'og:url', canonical);
  html = upsertMeta(html, 'name', 'twitter:url', canonical);

  const rootPageUrl = `${siteUrl}/${fileName}`;
  html = html.replace(new RegExp(escapeRegExp(rootPageUrl), 'g'), canonical);
  if (fileName.startsWith('article-')) {
    html = html.replaceAll(`${siteUrl}/blog.html`, pageUrl(locale, 'blog.html'));
  }

  const seoLinks = `\n    <link rel="canonical" href="${canonical}">\n${alternateLinks(fileName, pageSets)}\n`;
  html = html.replace(/<\/head>/i, `${seoLinks}</head>`);
  fs.writeFileSync(filePath, html, 'utf8');
}

function buildSitemap(pageSets) {
  const urls = locales.flatMap((locale) =>
    [...pageSets.get(locale.directory)]
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => pageUrl(locale, fileName))
  );
  const entries = urls.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  fs.writeFileSync(path.join(rootDir, 'static', 'sitemap.xml'), sitemap, 'utf8');
  return urls.length;
}

const pageSets = new Map(
  locales.map((locale) => {
    const directory = path.join(rootDir, locale.directory);
    const pages = fs.readdirSync(directory)
      .filter((fileName) => fileName.endsWith('.html'));
    return [locale.directory, new Set(pages)];
  })
);

let pageCount = 0;
for (const locale of locales) {
  for (const fileName of pageSets.get(locale.directory)) {
    normalizePage(path.join(rootDir, locale.directory, fileName), locale, fileName, pageSets);
    pageCount += 1;
  }
}

const sitemapCount = buildSitemap(pageSets);
console.log(`Normalized ${pageCount} localized pages and generated ${sitemapCount} sitemap URLs.`);
