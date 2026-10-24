const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { render } = require('./build-root-homepage');

test('root homepage reuses the complete English content and resolves its assets and navigation', () => {
  const english = fs.readFileSync(path.join(__dirname, '../en/index.html'), 'utf8');
  const root = render(english);
  assert.equal(root.slice(root.indexOf('<!DOCTYPE')).replace(/    <base href="\/en\/">\r?\n/, ''), english);
  assert.doesNotMatch(root, /http-equiv=["']refresh["']/i);
  assert.match(root, /<h1>/);
  assert.match(root, /id="products"/);
  assert.match(root, /<include src="components\/header.html"><\/include>/);
  assert.match(root, /<include src="components\/footer.html"><\/include>/);
  assert.match(root, /rel="canonical" href="https:\/\/supuzz.com\/en\/index.html"/);
  const base = new URL('/en/', 'https://supuzz.com/');
  for (const [relative, expected] of [
    ['blog.html', '/en/blog.html'],
    ['contact.html', '/en/contact.html'],
    ['product-coral-reef-l3.html', '/en/product-coral-reef-l3.html'],
    ['../css/style.css', '/css/style.css'],
    ['../api/api-service.js', '/api/api-service.js']
  ]) assert.equal(new URL(relative, base).pathname, expected);
});

test('root entry remains English regardless of browser language or saved language preference', () => {
  const header = fs.readFileSync(path.join(__dirname, '../components/header.html'), 'utf8');
  const script = header.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const pathname of ['/', '/index.html']) {
    for (const language of ['en-US', 'es-ES', 'ja-JP', 'zh-TW']) {
      for (const cookie of ['', 'lang_pref=es']) {
        const location = { pathname, href: pathname };
        const document = { cookie, addEventListener() {} };
        vm.runInNewContext(script, {
          window: { location }, document,
          navigator: { languages: [language], language }
        });
        assert.equal(location.href, pathname, `${pathname}: ${language}, ${cookie}`);
        assert.equal(document.cookie, cookie, 'Opening the root must not overwrite the language preference');
      }
    }
  }
});
