// Keep the legacy build command, but generate every article through IcyWorldBuilder.
const fs = require('node:fs');
const path = require('node:path');
const { locales } = require('./product-localization');
const retired = require('../resource/retired-holiday-articles.json');
const root = path.resolve(__dirname, '..');
const file = 'article-icy-world.html';
new (require('../builders/IcyWorldBuilder'))().build();
require('./build-article-blog').run(root);
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const write = (name, text) => fs.writeFileSync(path.join(root, name), text.trimEnd() + '\n');
for (const locale of locales) {
  const dir = locale.directory;
  const c = require(path.join(root, 'resource/pages/icy-world', dir + '.json'));
  fs.mkdirSync(path.join(root,'static',dir),{recursive:true});
  for(const [old,target] of Object.entries(retired)) {
    write(`static/${dir}/${old}`,`<!DOCTYPE html>
<html lang="${locale.htmlLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, follow"><link rel="canonical" href="https://supuzz.com/${dir}/${target}"><meta http-equiv="refresh" content="0;url=${target}"><title>SUPUZZ</title></head><body><p><a href="${target}">${escape(target===file?c.title:dir==='en'?'Halloween Toy Gifts for Kids: A Non-Candy Guide':require(`../resource/halloween-locales/${dir}.cjs`).articles[0].title)}</a></p></body></html>`);
  }
}
const posts = require('../resource/home-posts-en.json');
const copy = require('../resource/pages/icy-world/en.json');
Object.assign(posts.find(post => post.file === file), {
  category: 'product-guides', title: copy.title, excerpt: copy.description, alt: copy.imageAlt
});
write('resource/home-posts-en.json', JSON.stringify(posts, null, 2));
console.log('Built seven Christmas guides with IcyWorldBuilder and preserved 42 holiday redirects.');
