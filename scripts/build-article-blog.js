// Article cards use the same locale resources as their generated pages.
const fs = require('node:fs');
const path = require('node:path');
const { decodeHTML } = require('entities');
const { blogCardInclude, withBlogCardStyles } = require('./blog-card');
const { publicationMetadata } = require('./article-publication');

function run(root = path.resolve(__dirname, '..')) {
  const source = path.join(root, 'resource/pages');
  const articles = fs.readdirSync(source, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => ({ id: entry.name, ...JSON.parse(fs.readFileSync(path.join(source, entry.name, 'page.json'), 'utf8')) }))
    .filter(definition => definition.type === 'article');
  const plans = new Map();
  let count = 0;
  for (const locale of new Set(articles.flatMap(article => article.locales))) {
    const file = path.join(root, locale, 'blog.html');
    let html = fs.readFileSync(file, 'utf8');
    const labels = new Map([...html.matchAll(/<button\b[^>]*data-filter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)]
      .map(([, category, text]) => [category, decodeHTML(text.replace(/<[^>]*>/g, '').trim())]));
    const remaining = new Map(articles.filter(article => article.locales.includes(locale)).map(article => [article.file, article]));
    const seen = new Set();
    const card = (article, existing = {}) => {
      const copy = JSON.parse(fs.readFileSync(path.join(source, article.id, `${locale}.json`), 'utf8'));
      const category = existing.category || 'building-blocks';
      const categoryLabel = labels.get(category);
      if (!categoryLabel) throw new Error(`Missing card category label: ${locale}/${article.file}`);
      count++;
      return blogCardInclude({
        ...existing, href: article.file, category, categoryLabel,
        title: copy.title, excerpt: copy.description, alt: copy.imageAlt,
        image: article.shared.image, width: article.shared.imageWidth, height: article.shared.imageHeight,
        ...publicationMetadata(path.join(root, locale, article.file), locale)
      });
    };
    const includes = /<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g;
    html = html.replace(includes, (include, json) => {
      const existing = JSON.parse(json);
      const article = articles.find(article => article.file === existing.href && article.locales.includes(locale));
      if (!article) return include;
      if (seen.has(article.file)) throw new Error(`Duplicate article card: ${locale}/${article.file}`);
      seen.add(article.file);
      remaining.delete(article.file);
      return card(article, existing);
    });
    if (remaining.size) {
      const matches = [...html.matchAll(includes)];
      if (!matches.length) throw new Error(`No blog card insertion point: ${locale}`);
      const last = matches.at(-1);
      const position = last.index + last[0].length;
      html = html.slice(0, position) + '\n' + [...remaining.values()].map(article => card(article)).join('\n') + html.slice(position);
    }
    plans.set(file, withBlogCardStyles(html));
  }
  // Reject incomplete resources or duplicate cards before writing any blog.
  for (const [file, html] of plans) {
    if (fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html);
  }
  console.log(`Synced ${count} article cards across ${plans.size} localized blogs.`);
  return count;
}

module.exports = { run };
if (require.main === module) run();
