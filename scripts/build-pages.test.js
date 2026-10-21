const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run } = require('./build-pages');
const { run: prepareSeo } = require('./prepare-seo');

const languages = ['en', 'es', 'ja', 'zh-Hant', 'de', 'pt', 'fr'];
function fixture(t, selected = languages) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-pages-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const directory of ['resource/pages/sample', 'templates/pages', 'static', ...languages]) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }
  const writeJson = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value));
  const definition = {
    file: 'article-sample.html', template: 'sample.cjs', type: 'article', locales: selected,
    shared: { image: '/product-images/sample.webp', imageWidth: 1200, imageHeight: 675, datePublished: '2026-10-20T09:00:00+08:00' }
  };
  writeJson('resource/pages/sample/page.json', definition);
  for (const language of selected) writeJson(`resource/pages/sample/${language}.json`, {
    title: `${language} <Title> & "quoted"`, description: `${language} description`,
    imageAlt: `${language} image`, homeLabel: `${language} home`, blogLabel: `${language} blog`,
    intro: `${language} introduction </script><script>test</script>`
  });
  const template = path.join(root, 'templates/pages/sample.cjs');
  fs.writeFileSync(template, 'module.exports = ({text}) => `<main class="container"><article class="article-container"><div class="article-header"><h1>${text("title")}</h1></div><p>${text("intro")}</p></article></main>`;');
  return { root, writeJson, definition, template };
}

test('one template generates seven locales with reciprocal SEO, shared facts, escaped copy and schema', t => {
  const { root, template } = fixture(t);
  assert.equal(run(root), 7);
  const before = fs.readFileSync(path.join(root, 'de/article-sample.html'), 'utf8');
  for (const language of languages) {
    const html = fs.readFileSync(path.join(root, language, 'article-sample.html'), 'utf8');
    assert.match(html, new RegExp(`<title>${language} &lt;Title&gt; &amp; &quot;quoted&quot;`));
    assert.match(html, /&lt;\/script&gt;&lt;script&gt;test&lt;\/script&gt;/);
    assert.equal((html.match(/<include /g) || []).length, 2);
    assert.doesNotMatch(html, /<header\b/);
    for (const alternate of languages) assert(html.includes(`hreflang="${alternate}" href="https://supuzz.com/${alternate}/article-sample.html"`));
    assert(html.includes(`rel="canonical" href="https://supuzz.com/${language}/article-sample.html"`));
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    assert.equal(schemas[0]['@type'], 'BlogPosting');
    assert.equal(schemas[0].datePublished, '2026-10-20T09:00:00+08:00');
    assert.equal(schemas[1].itemListElement[1].name, `${language} blog`);
  }
  run(root);
  assert.equal(fs.readFileSync(path.join(root, 'de/article-sample.html'), 'utf8'), before);
  fs.appendFileSync(template, '\nmodule.exports = ((original) => (context) => original(context).replace("<main ", "<main data-updated=\\"yes\\" "))(module.exports);');
  run(root);
  for (const language of languages) assert.match(fs.readFileSync(path.join(root, language, 'article-sample.html'), 'utf8'), /data-updated="yes"/);
  prepareSeo(root);
  const sitemap = fs.readFileSync(path.join(root, 'static/sitemap.xml'), 'utf8');
  for (const language of languages) assert(sitemap.includes(`https://supuzz.com/${language}/article-sample.html`));
});

test('missing translations or template text fail before changing any generated pages', t => {
  const { root, writeJson } = fixture(t);
  run(root);
  const english = path.join(root, 'en/article-sample.html');
  const before = fs.readFileSync(english, 'utf8');
  const enCopy = JSON.parse(fs.readFileSync(path.join(root, 'resource/pages/sample/en.json'), 'utf8'));
  writeJson('resource/pages/sample/en.json', { ...enCopy, title: 'New title' });
  fs.unlinkSync(path.join(root, 'resource/pages/sample/fr.json'));
  assert.throws(() => run(root), /fr\.json/);
  assert.equal(fs.readFileSync(english, 'utf8'), before);
  writeJson('resource/pages/sample/fr.json', { ...enCopy, intro: '' });
  assert.throws(() => run(root), /sample\/fr\/intro/);
  assert.equal(fs.readFileSync(english, 'utf8'), before);
});

test('explicit locale subset generates only those languages and never overwrites legacy pages', t => {
  const { root, definition, writeJson } = fixture(t, ['zh-Hant']);
  assert.equal(run(root), 1);
  assert(!fs.existsSync(path.join(root, 'en/article-sample.html')));
  assert.match(fs.readFileSync(path.join(root, 'zh-Hant/article-sample.html'), 'utf8'), /hreflang="x-default" href="https:\/\/supuzz.com\/zh-Hant\/article-sample.html"/);
  writeJson('resource/pages/sample/page.json', { ...definition, file: 'existing.html' });
  fs.writeFileSync(path.join(root, 'zh-Hant/existing.html'), 'Legacy page');
  assert.throws(() => run(root), /Refusing to overwrite/);
  assert.equal(fs.readFileSync(path.join(root, 'zh-Hant/existing.html'), 'utf8'), 'Legacy page');
});

test('invalid output paths and nested document shells are rejected', t => {
  const { root, definition, writeJson, template } = fixture(t, ['en']);
  writeJson('resource/pages/sample/page.json', { ...definition, file: '../outside.html' });
  assert.throws(() => run(root), /Invalid page filename/);
  writeJson('resource/pages/sample/page.json', definition);
  fs.writeFileSync(template, 'module.exports = () => "<article><header>Nested toolbar</header></article>";');
  assert.throws(() => run(root), /shared document shell/);
  assert(!fs.existsSync(path.join(root, 'en/article-sample.html')));
});

test('normal pages preserve custom document titles, ContactPage type and additional structured data', t => {
  const { root, definition, writeJson, template } = fixture(t, ['en']);
  writeJson('resource/pages/sample/page.json', { ...definition, type: 'page', schemaType: 'ContactPage' });
  const contentPath = path.join(root, 'resource/pages/sample/en.json');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  writeJson('resource/pages/sample/en.json', { ...content, documentTitle: 'Contact SUPUZZ | Wholesale & OEM' });
  fs.appendFileSync(template, '\nmodule.exports.structuredData = () => [{"@context":"https://schema.org","@type":"Organization","name":"SUPUZZ"}];');
  run(root);
  const html = fs.readFileSync(path.join(root, 'en/article-sample.html'), 'utf8');
  assert.match(html, /<title>Contact SUPUZZ \| Wholesale &amp; OEM<\/title>/);
  assert.match(html, /"@type":"ContactPage"/);
  assert.match(html, /"@type":"Organization"/);
  assert.doesNotMatch(html, /"@type":"BlogPosting"/);
});

test('ContactBuilder generates complete localized forms and safely embeds runtime messages', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-contact-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projectRoot = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'resource/pages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'builders'), { recursive: true });
  fs.cpSync(path.join(projectRoot, 'resource/pages/contact'), path.join(root, 'resource/pages/contact'), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'resource/education-offer.json'), path.join(root, 'resource/education-offer.json'));
  fs.copyFileSync(path.join(projectRoot, 'builders/ContactBuilder.js'), path.join(root, 'builders/ContactBuilder.js'));
  const ContactBuilder = require('../builders/ContactBuilder');
  const builder = new ContactBuilder({ rootDir: root });
  assert.equal(builder.build(), 7);
  for (const language of languages) {
    const html = fs.readFileSync(path.join(root, language, 'contact.html'), 'utf8');
    const copy = JSON.parse(fs.readFileSync(path.join(root, 'resource/pages/contact', `${language}.json`), 'utf8'));
    const messages = JSON.parse(html.match(/<script type="application\/json" id="contactMessages">([\s\S]*?)<\/script>/)[1]);
    assert.equal(messages.success, copy.feedback.success);
    assert.equal(messages.submit, copy.form.submit);
    assert.deepEqual(messages.educationOffer, { id: 'EDUCATION_10', discountPercent: 10 });
    assert.match(html, /value="education">[^<]*10%/);
    assert.match(html, /value="gifts"/);
    assert(html.includes(`data-language="${language}"`));
    assert.match(html, /name="inquiryType" required/);
    assert.match(html, /name="email"[^>]*\brequired\b/);
    assert.match(html, /name="message" required/);
    assert.match(html, /"@type":"ContactPage"/);
    assert.match(html, /mailto:atmanpro@163\.com/);
    assert.equal((html.match(/<include /g) || []).length, 2);
    assert.doesNotMatch(html, /undefined|\$\{text\(/);
  }
  const frenchPath = path.join(root, 'resource/pages/contact/fr.json');
  const french = JSON.parse(fs.readFileSync(frenchPath, 'utf8'));
  french.feedback.success = '</script><script>unexpected()</script>';
  fs.writeFileSync(frenchPath, JSON.stringify(french));
  run(root);
  const html = fs.readFileSync(path.join(root, 'fr/contact.html'), 'utf8');
  assert(!html.includes(french.feedback.success));
  assert.equal(JSON.parse(html.match(/id="contactMessages">([\s\S]*?)<\/script>/)[1]).success, french.feedback.success);
  delete french.feedback.error;
  fs.writeFileSync(frenchPath, JSON.stringify(french));
  assert.throws(() => run(root), /contact\/fr\/feedback.error/);
  assert.equal(fs.readFileSync(path.join(root, 'fr/contact.html'), 'utf8'), html);
  french.feedback.error = 'Test error';
  fs.writeFileSync(frenchPath, JSON.stringify(french));
  fs.mkdirSync(path.join(root, 'resource/pages/unrelated'));
  fs.writeFileSync(path.join(root, 'resource/pages/unrelated/page.json'), 'invalid unrelated source');
  assert.equal(builder.build(), 7);
  assert.throws(() => run(root, ['missing-page']), /Unknown page id/);
  assert.match(fs.readFileSync(path.join(root, 'en/contact.html'), 'utf8'), /Builder: builders\/ContactBuilder\.js/);
});

test('BuildingBlocksPremiumBuilder generates seven localized articles and rejects incomplete copy', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-blocks-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projectRoot = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'resource/pages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'builders'), { recursive: true });
  fs.cpSync(path.join(projectRoot, 'resource/pages/building-blocks-premium'), path.join(root, 'resource/pages/building-blocks-premium'), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'builders/BuildingBlocksPremiumBuilder.js'), path.join(root, 'builders/BuildingBlocksPremiumBuilder.js'));
  const Builder = require('../builders/BuildingBlocksPremiumBuilder');
  const builder = new Builder({ rootDir: root });
  assert.equal(builder.build(), 7);
  for (const language of languages) {
    const html = fs.readFileSync(path.join(root, language, 'article-building-blocks-premium.html'), 'utf8');
    const copy = JSON.parse(fs.readFileSync(path.join(root, 'resource/pages/building-blocks-premium', `${language}.json`), 'utf8'));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.headline, copy.title);
    assert.equal((html.match(/hreflang=/g) || []).length, 8);
    assert.match(html, /<time datetime="2025-11-20">[^<]+<\/time>/);
    assert(html.includes(`rel="canonical" href="https://supuzz.com/${language}/article-building-blocks-premium.html"`));
  }
  const file = path.join(root, 'ja/article-building-blocks-premium.html');
  const before = fs.readFileSync(file, 'utf8');
  const copyPath = path.join(root, 'resource/pages/building-blocks-premium/ja.json');
  const copy = JSON.parse(fs.readFileSync(copyPath, 'utf8'));
  assert(before.includes(`<h1>${copy.title}</h1>`));
  assert.match(before, /<html lang="ja-JP">/);
  assert.match(before, /property="og:locale" content="ja_JP"/);
  assert.match(before, /rel="canonical" href="https:\/\/supuzz.com\/ja\/article-building-blocks-premium.html"/);
  assert.equal((before.match(/<include /g) || []).length, 2);
  assert.doesNotMatch(before, /<header\b|Wholesale|OEM|Introducing the|undefined/);
  const schema = JSON.parse(before.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema.headline, copy.title);
  assert.equal(schema.inLanguage, 'ja-JP');
  assert.equal(schema.datePublished, '2025-11-20T00:00:00+00:00');
  delete copy.models.images.camera.alt;
  fs.writeFileSync(copyPath, JSON.stringify(copy));
  assert.throws(() => builder.build(), /models.images.camera.alt/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  copy.models.images.camera.alt = 'カメラ';
  copy.faq.items = [];
  fs.writeFileSync(copyPath, JSON.stringify(copy));
  assert.throws(() => builder.build(), /faq.items/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('seven migrated guides generate all 49 locale pages and reject incomplete translations atomically', t => {
  const ids = ['icy-world', 'mix-play', 'waffle-blocks-stem-toddler', 'rainbow-blocks-gift-checklist', 'thanksgiving-gift', 'kids-chair', 'levels'];
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-japanese-guides-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projectRoot = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'resource/pages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'builders'), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'builders/ArticleBuilder.js'), path.join(root, 'builders/ArticleBuilder.js'));
  for (const id of ids) {
    fs.cpSync(path.join(projectRoot, 'resource/pages', id), path.join(root, 'resource/pages', id), { recursive: true });
    const definition = JSON.parse(fs.readFileSync(path.join(root, 'resource/pages', id, 'page.json'), 'utf8'));
    fs.copyFileSync(path.join(projectRoot, 'builders', definition.builder), path.join(root, 'builders', definition.builder));
  }
  assert.equal(run(root), 49);
  const before = new Map();
  for (const id of ids) {
    for (const language of languages) {
      const locale = require('./product-localization').locales.find(locale => locale.directory === language);
      const file = path.join(root, `${language}/article-${id}.html`);
      const html = fs.readFileSync(file, 'utf8');
      before.set(file, html);
      const copy = JSON.parse(fs.readFileSync(path.join(root, `resource/pages/${id}/${language}.json`), 'utf8'));
      assert.equal(require('entities').decodeHTML(html.match(/<h1>(.*?)<\/h1>/)[1]), copy.title);
      if (language === 'ja') assert.match(copy.title, /[\u3040-\u30ff]/);
      assert(html.includes(`<html lang="${locale.htmlLang}">`));
      assert(html.includes(`property="og:locale" content="${locale.ogLocale}"`));
      assert(html.includes(`rel="canonical" href="https://supuzz.com/${language}/article-${id}.html"`));
      for (const alternate of languages) assert(html.includes(`hreflang="${alternate}" href="https://supuzz.com/${alternate}/article-${id}.html"`));
      assert.equal((html.match(/hreflang=/g) || []).length, 8);
      assert.equal((html.match(/<include /g) || []).length, 2);
      assert.doesNotMatch(html, /<header\b|undefined|Wholesale|OEM|IKEA/);
      const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
      assert.equal(schemas[0].headline, copy.title);
      assert.equal(schemas[0].inLanguage, locale.htmlLang);
      assert.equal(schemas[1].itemListElement[1].name, copy.blogLabel);
    }
  }
  const file = path.join(root, 'resource/pages/icy-world/ja.json');
  const copy = JSON.parse(fs.readFileSync(file, 'utf8'));
  copy.title = 'Changed title';
  delete copy.sections.levelOne.image.alt;
  fs.writeFileSync(file, JSON.stringify(copy));
  assert.throws(() => run(root), /sections.levelOne.image.alt/);
  for (const [file, html] of before) assert.equal(fs.readFileSync(file, 'utf8'), html);
  copy.sections.levelOne.image.alt = '氷の世界';
  fs.writeFileSync(file, JSON.stringify(copy));
  fs.unlinkSync(path.join(root, 'resource/pages/levels/ja.json'));
  assert.throws(() => run(root), /ja\.json/);
  for (const [file, html] of before) assert.equal(fs.readFileSync(file, 'utf8'), html);
});

test('article blog sync follows locale resources, inserts missing cards once and rejects duplicates atomically', t => {
  const { root, definition, writeJson } = fixture(t);
  const { run: syncBlog } = require('./build-article-blog');
  const { blogCardInclude } = require('./blog-card');
  const card = blogCardInclude({ href: 'unrelated.html', category: 'building-blocks', image: '/other.webp', width: 100, height: 100, alt: 'Other', title: 'Other', excerpt: 'Other' });
  for (const language of languages) {
    fs.writeFileSync(path.join(root, language, 'blog.html'), `<head></head><button data-filter="building-blocks">${language} category</button><div class="blog-grid">${card}</div>`);
  }
  run(root);
  assert.equal(syncBlog(root), 7);
  const before = new Map();
  for (const language of languages) {
    const file = path.join(root, language, 'blog.html');
    const html = fs.readFileSync(file, 'utf8');
    before.set(file, html);
    const cards = [...html.matchAll(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g)].map(match => JSON.parse(match[1]));
    assert.equal(cards.length, 2);
    const article = cards.find(card => card.href === definition.file);
    assert.equal(article.title, `${language} <Title> & "quoted"`);
    assert.equal(article.excerpt, `${language} description`);
    assert.equal(article.categoryLabel, `${language} category`);
    assert.equal(article.image, definition.shared.image);
    assert.equal(article.date, '2026-10-20');
    assert.equal(article.alt, `${language} image`);
  }
  syncBlog(root);
  for (const [file, html] of before) assert.equal(fs.readFileSync(file, 'utf8'), html);
  const englishCopy = JSON.parse(fs.readFileSync(path.join(root, 'resource/pages/sample/en.json'), 'utf8'));
  writeJson('resource/pages/sample/en.json', { ...englishCopy, title: 'Updated English title', description: 'Updated excerpt' });
  run(root);
  syncBlog(root);
  const english = fs.readFileSync(path.join(root, 'en/blog.html'), 'utf8');
  assert.match(english, /Updated English title/);
  assert.match(english, /Updated excerpt/);
  const frenchFile = path.join(root, 'fr/blog.html');
  const french = fs.readFileSync(frenchFile, 'utf8');
  const duplicate = [...french.matchAll(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g)].find(match => JSON.parse(match[1]).href === definition.file)[0];
  fs.writeFileSync(frenchFile, french + duplicate);
  writeJson('resource/pages/sample/en.json', { ...englishCopy, title: 'Should not update blog' });
  assert.throws(() => syncBlog(root), /Duplicate article card/);
  assert.equal(fs.readFileSync(path.join(root, 'en/blog.html'), 'utf8'), english);
});

test('AboutBuilder preserves locale content and rejects incomplete sections before writing', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-about-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const projectRoot = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'resource/pages'), { recursive: true });
  fs.mkdirSync(path.join(root, 'builders'), { recursive: true });
  fs.cpSync(path.join(projectRoot, 'resource/pages/about'), path.join(root, 'resource/pages/about'), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'builders/AboutBuilder.js'), path.join(root, 'builders/AboutBuilder.js'));
  const AboutBuilder = require('../builders/AboutBuilder');
  const builder = new AboutBuilder({ rootDir: root });
  assert.equal(builder.build(), 7);
  for (const language of languages) {
    const html = fs.readFileSync(path.join(root, language, 'about.html'), 'utf8');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    assert.equal(schemas[0]['@type'], 'AboutPage');
    assert.equal(schemas[0].url, `https://supuzz.com/${language}/about.html`);
    assert.equal(schemas[1]['@type'], 'Organization');
  }
  const englishPath = path.join(root, 'resource/pages/about/en.json');
  const english = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
  english.philosophy.paragraphs.push('An extra localized paragraph <with markup>');
  fs.writeFileSync(englishPath, JSON.stringify(english));
  builder.build();
  const before = fs.readFileSync(path.join(root, 'en/about.html'), 'utf8');
  assert.match(before, /An extra localized paragraph &lt;with markup&gt;/);
  english.title = 'Changed title';
  fs.writeFileSync(englishPath, JSON.stringify(english));
  const frenchPath = path.join(root, 'resource/pages/about/fr.json');
  const french = JSON.parse(fs.readFileSync(frenchPath, 'utf8'));
  french.philosophy.paragraphs = [];
  fs.writeFileSync(frenchPath, JSON.stringify(french));
  assert.throws(() => builder.build(), /Missing about philosophy paragraphs/);
  assert.equal(fs.readFileSync(path.join(root, 'en/about.html'), 'utf8'), before);
});
