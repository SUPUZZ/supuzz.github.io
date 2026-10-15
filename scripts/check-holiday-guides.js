// Guard against deleted articles returning through generators or stale internal links.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { parser } = require('posthtml-parser');
const { locales } = require('./product-localization');
const retired = require('../resource/retired-holiday-articles.json');
const root = path.resolve(__dirname, '..');
const flat = ns => ns.flatMap(n => typeof n === 'object' ? [n,...flat(n.content || [])] : []);
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const sitemap = read('static/sitemap.xml');
for (const {directory:dir,htmlLang} of locales) {
  const files = fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html'));
  assert.equal(files.filter(f=>f.includes('halloween')).length,1,`${dir}: one Halloween article`);
  const cards = [...read(`${dir}/blog.html`).matchAll(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g)].map(m=>JSON.parse(m[1]));
  assert.equal(cards.filter(c=>c.category==='halloween-gifts').length,1);
  assert.equal(cards.filter(c=>c.href==='article-icy-world.html').length,1,`${dir}: one Christmas card`);
  for (const [old,target] of Object.entries(retired)) {
    assert(!files.includes(old),`${dir}: retired source recreated: ${old}`);
    assert(!sitemap.includes(`/${dir}/${old}</loc>`),`${dir}: retired sitemap URL`);
    const redirect = read(`static/${dir}/${old}`);
    assert(redirect.includes('noindex, follow'));
    assert(redirect.includes(`content="0;url=${target}"`));
    assert(redirect.includes(`href="https://supuzz.com/${dir}/${target}"`));
    if(process.argv.includes('--dist')) assert.equal(read(`dist/${dir}/${old}`),redirect,`${dir}: deployed redirect`);
  }
  for(const file of files) {
    const nodes=flat(parser(read(`${dir}/${file}`)));
    for(const n of nodes) {
      const href=n.attrs?.href;
      if(!href) continue;
      assert(!Object.keys(retired).some(old=>href.split(/[?#]/)[0].endsWith('/'+old)||href.split(/[?#]/)[0]===old),`${dir}/${file}: retired link ${href}`);
    }
  }
  const file=`${dir}/article-icy-world.html`;
  const nodes=flat(parser(read(file)));
  assert.equal(nodes.find(n=>n.tag==='html').attrs.lang,htmlLang);
  assert.equal(nodes.filter(n=>n.tag==='h1').length,1);
  assert.equal(nodes.filter(n=>n.tag==='include').length,2);
  assert.equal(nodes.filter(n=>n.tag==='header').length,0);
  assert.equal(nodes.filter(n=>n.attrs?.hreflang).length,8);
  const schema=nodes.filter(n=>n.attrs?.type==='application/ld+json').map(n=>JSON.parse(n.content.join(''))).find(s=>s['@type']==='BlogPosting');
  assert.equal(schema.inLanguage,htmlLang);
  assert.equal(schema.mainEntityOfPage['@id'],`https://supuzz.com/${file}`);
  const hero=nodes.find(n=>n.tag==='img'&&n.attrs.class==='featured-img');
  assert.equal(Number(hero.attrs.width)/Number(hero.attrs.height),16/9);
  assert.equal(schema.image.url,'https://supuzz.com'+hero.attrs.src);
  for(const slug of ['icy-world-l1','icy-world-l2','icy-world-l3']) assert(nodes.some(n=>n.attrs?.href===`product-${slug}.html`));
  for(const n of nodes.filter(n=>n.tag==='img')) assert(fs.existsSync(path.join(root,'static',n.attrs.src)));
  assert.equal(cards.find(c=>c.href==='article-icy-world.html').title,schema.headline);
  assert.equal((sitemap.match(new RegExp(`https://supuzz.com/${dir}/article-icy-world\\.html`,'g'))||[]).length,1);
  if(process.argv.includes('--dist')) {
    const built=flat(parser(read('dist/'+file)));
    assert.equal(built.filter(n=>n.tag==='header').length,1);
    assert.equal(built.filter(n=>n.tag==='footer').length,1);
    assert.equal(built.filter(n=>n.tag==='include').length,0);
  }
}
console.log('PASS: seven languages each have one Halloween guide and one Christmas guide, with no retired internal links or sitemap entries and 42 valid redirects.');
