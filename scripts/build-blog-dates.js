// Display the linked article's publication date on every localized blog card.
const fs = require('fs');
const path = require('path');
const { decodeHTML } = require('entities');
const { blogCardInclude, withBlogCardStyles } = require('./blog-card');
const { publicationMetadata } = require('./article-publication');
const { halloweenCardCover } = require('./halloween-card-cover');
const root = path.resolve(__dirname, '..');
for (const directory of ['en', 'es', 'ja', 'zh-Hant', 'de', 'pt', 'fr']) {
  const pagePath = path.join(root, directory, 'blog.html');
  let page = fs.readFileSync(pagePath, 'utf8');
  const categoryLabels = new Map([...page.matchAll(/<button\b[^>]*data-filter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)]
    .map(([, category, text]) => [category, decodeHTML(text.replace(/<[^>]*>/g, '').trim())]));
  let count = 0;
  page = page.replace(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g, (include, json) => {
    const card = JSON.parse(json);
    const { href } = card;
    const categoryLabel = categoryLabels.get(card.category);
    if (!categoryLabel) throw new Error(`Missing card category label: ${directory}/${href}`);
    if (!/^[\w-]+\.html$/.test(href)) throw new Error(`Expected a local article link: ${directory}/${href}`);
    count += 1;
    return blogCardInclude({
      ...card, categoryLabel,
      ...publicationMetadata(path.join(root, directory, href), directory),
      ...(card.category === 'halloween-gifts' ? halloweenCardCover(directory) : {})
    });
  });
  if (!count) throw new Error(`No blog cards found: ${directory}`);
  if (!page.includes('href="../css/blog-list.css"')) page = page.replace('</head>', '    <link rel="stylesheet" href="../css/blog-list.css">\n</head>');
  fs.writeFileSync(pagePath, withBlogCardStyles(page));
  console.log(`Added article publication dates to ${count} ${directory} blog cards.`);
}
