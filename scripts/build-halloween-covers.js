// Keep article heroes and social previews aligned with each article's own card cover.
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { halloweenArticles, halloweenHeroCover } = require('./halloween-card-cover');
const root = path.resolve(__dirname, '..');
const styleVersion = createHash('sha256').update(fs.readFileSync(path.join(root, 'static/css/halloween-guides.css'))).digest('hex').slice(0, 12);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const directory of ['en', 'es', 'ja', 'zh-Hant', 'de', 'pt', 'fr']) {
  for (const href of halloweenArticles) {
    const file = path.join(root, directory, href);
    const cover = halloweenHeroCover(directory, href);
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/href="\.\.\/css\/halloween-guides\.css(?:\?[^"]*)?"/, `href="../css/halloween-guides.css?v=${styleVersion}"`);
    for (const [name, value] of Object.entries({
      'og:image':`https://supuzz.com${cover.src}`, 'twitter:image':`https://supuzz.com${cover.src}`,
      'og:image:width':cover.width, 'og:image:height':cover.height,
      'og:image:alt':cover.alt, 'twitter:image:alt':cover.alt
    })) {
      const meta = new RegExp(`(<meta\\b[^>]*(?:property|name)="${name}"[^>]*content=")[^"]*(")`);
      if (!meta.test(html)) throw new Error(`Missing ${name}: ${directory}/${href}`);
      html = html.replace(meta, (_, start, end) => start + escape(value) + end);
    }
    html = html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (match, open, json, close) => {
      const schema = JSON.parse(json);
      if (schema['@type'] !== 'BlogPosting') return match;
      schema.image = {'@type':'ImageObject', url:`https://supuzz.com${cover.src}`, width:cover.width, height:cover.height};
      return open + JSON.stringify(schema, null, 2) + close;
    });
    const figure = /<figure>\s*<img\b[^>]*class="featured-img"[^>]*>\s*<figcaption>[\s\S]*?<\/figcaption>\s*<\/figure>/;
    if (!figure.test(html)) throw new Error(`Missing article cover: ${directory}/${href}`);
    html = html.replace(figure, `<figure><img class="featured-img" src="${cover.src}" width="${cover.width}" height="${cover.height}" alt="${escape(cover.alt)}" fetchpriority="high" decoding="async"><figcaption>${escape(cover.caption)}</figcaption></figure>`);
    fs.writeFileSync(file, html);
  }
  console.log(`Updated the Halloween guide cover for ${directory}.`);
}
