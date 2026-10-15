// Shared include data for the blog index and homepage article cards.
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

function withBlogCardStyles(page) {
  const css = fs.readFileSync(path.join(__dirname, '..', 'static', 'css', 'blog-card.css'));
  const version = createHash('sha256').update(css).digest('hex').slice(0, 12);
  const link = `<link rel="stylesheet" href="../css/blog-card.css?v=${version}">`;
  // Load card styles directly so a cached parent stylesheet cannot omit them.
  const existing = /<link\b[^>]*href="\.\.\/css\/blog-card\.css(?:\?[^"]*)?"[^>]*>/;
  if (existing.test(page)) return page.replace(existing, link);
  if (!page.includes('</head>')) throw new Error('Missing page head for blog card stylesheet');
  return page.replace('</head>', `    ${link}\n</head>`);
}

function blogCardInclude(post) {
  const data = { category: '', categoryLabel: '', label: '', date: '', dateText: '', ...post };
  for (const key of ['href', 'image', 'width', 'height', 'alt', 'title', 'excerpt']) {
    if (!data[key]) throw new Error(`Missing blog card ${key}: ${data.href || 'unknown article'}`);
  }
  // Keep JSON inside the include safe even when editorial copy contains HTML characters.
  const json = JSON.stringify(data, null, 4).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
  return `<include src="components/blog-card.html">\n${json}\n</include>`;
}

module.exports = { blogCardInclude, withBlogCardStyles };
