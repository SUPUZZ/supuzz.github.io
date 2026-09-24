const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { run } = require('./prepare-seo');

test('SEO build excludes previews, preserves sitemap dates/order, and supports targeted normalization', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'supuzz-seo-'));
  try {
    for (const dir of ['en','es','ja','zh-Hant','de','pt','fr','static']) fs.mkdirSync(path.join(root,dir));
    const page = robots => `<html lang="en"><head><meta name="robots" content="${robots}"></head><body>Collection</body></html>`;
    fs.writeFileSync(path.join(root,'en/future.html'),page('index, follow'));
    fs.writeFileSync(path.join(root,'en/index.html'),page('index, follow'));
    fs.writeFileSync(path.join(root,'zh-Hant/future.html'),page('noindex, nofollow'));
    fs.writeFileSync(path.join(root,'fr/future.html'),'<html><head><meta content="none" name="googlebot"></head></html>');
    const originalHome = fs.readFileSync(path.join(root,'en/index.html'),'utf8');
    fs.writeFileSync(path.join(root,'static/sitemap.xml'),`<urlset><url><loc>https://supuzz.com/en/index.html</loc><lastmod>2026-09-09</lastmod></url><url><loc>https://supuzz.com/zh-Hant/future.html</loc></url></urlset>`);
    run(root,['en/future.html']);
    const en = fs.readFileSync(path.join(root,'en/future.html'),'utf8');
    assert.match(en,/hreflang="en"/);
    assert.match(en,/hreflang="x-default"/);
    assert.doesNotMatch(en,/hreflang="(?:zh-Hant|fr)"/);
    assert.equal((en.match(/rel="canonical"/g)||[]).length,1);
    assert.equal(fs.readFileSync(path.join(root,'en/index.html'),'utf8'),originalHome);
    const sitemap = fs.readFileSync(path.join(root,'static/sitemap.xml'),'utf8');
    assert.match(sitemap,/<lastmod>2026-09-09<\/lastmod>/);
    assert.doesNotMatch(sitemap,/zh-Hant|\/fr\//);
    assert(sitemap.indexOf('en/index.html') < sitemap.indexOf('en/future.html'));
    run(root,['en/future.html']);
    assert.equal(fs.readFileSync(path.join(root,'static/sitemap.xml'),'utf8'),sitemap);
    assert.equal(fs.readFileSync(path.join(root,'en/future.html'),'utf8'),en);
    // When another locale becomes indexable, links are reciprocal.
    fs.writeFileSync(path.join(root,'zh-Hant/future.html'),page('index, follow'));
    run(root);
    for (const locale of ['en','zh-Hant']) {
      const translated = fs.readFileSync(path.join(root,locale,'future.html'),'utf8');
      assert.match(translated,/hreflang="en"/);
      assert.match(translated,/hreflang="zh-Hant"/);
    }
  } finally {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert(path.basename(root).startsWith('supuzz-seo-'));
    fs.rmSync(root,{recursive:true,force:true});
  }
});
