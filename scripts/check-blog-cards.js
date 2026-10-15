// Check the actual production HTML before deployment: optimizers must preserve card metadata.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { parser } = require('posthtml-parser');
const { decodeHTML } = require('entities');
const { publicationMetadata } = require('./article-publication');
const { halloweenCardCover } = require('./halloween-card-cover');
const root = path.resolve(__dirname, '..');
const flatten = nodes => nodes.flatMap(node => typeof node === 'object' ? [node, ...flatten(node.content || [])] : []);
const hasClass = (node, name) => (node.attrs?.class || '').split(/\s+/).includes(name);
const text = node => decodeHTML((node.content || []).map(child => typeof child === 'string' ? child : text(child)).join('')).trim();
let count = 0;
for (const directory of ['en', 'es', 'ja', 'zh-Hant', 'de', 'pt', 'fr']) {
  for (const page of ['blog', 'index']) {
    const file = `${directory}/${page}.html`;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const expected = [...source.matchAll(/<include src="components\/blog-card\.html">([\s\S]*?)<\/include>/g)].map(match => JSON.parse(match[1]));
    const nodes = flatten(parser(fs.readFileSync(path.join(root, 'dist', file), 'utf8')));
    const cards = nodes.filter(node => hasClass(node, 'blog-card'));
    assert(expected.length > 0, `${file}: missing source cards`);
    assert.equal(cards.length, expected.length, `${file}: card count`);
    for (const [index, card] of cards.entries()) {
      const post = expected[index];
      const children = flatten(card.content || []);
      const badge = children.find(node => hasClass(node, 'blog-card-category'));
      const publication = publicationMetadata(path.join(root, directory, post.href), directory);
      assert.equal(post.date, publication.date, `${file}: source publication date for ${post.href}`);
      assert.equal(post.dateText, publication.dateText, `${file}: source publication text for ${post.href}`);
      assert.equal(card.attrs.href, post.href, `${file}: article link`);
      assert(badge, `${file}: missing category badge`);
      assert.equal(text(badge), post.categoryLabel, `${file}: category text`);
      const time = children.find(node => node.tag === 'time');
      assert(time, `${file}: missing publication date for ${post.href}`);
      assert.equal(time.attrs.datetime, post.date, `${file}: publication date`);
      assert.equal(text(time), post.dateText, `${file}: visible date text`);
      assert(children.some(node => hasClass(node, 'blog-card-calendar')), `${file}: calendar icon`);
      const image = children.find(node => node.tag === 'img');
      assert(image, `${file}: missing cover for ${post.href}`);
      assert.equal(image.attrs.src, post.image, `${file}: production cover for ${post.href}`);
      if (post.category === 'halloween-gifts') {
        const cover = halloweenCardCover(directory);
        for (const key of ['image', 'width', 'height', 'alt']) assert.equal(post[key], cover[key], `${file}: Halloween cover ${key}`);
        assert.equal(+image.attrs.width, cover.width, `${file}: Halloween image width`);
        assert.equal(+image.attrs.height, cover.height, `${file}: Halloween image height`);
      }
      count++;
    }
  }
}
console.log(`Verified publication dates, category badges and covers on ${count} production cards.`);
