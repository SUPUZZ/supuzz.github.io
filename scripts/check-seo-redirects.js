const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parser } = require('posthtml-parser');

const root = path.resolve(__dirname, '..');
const built = process.argv.includes('--dist');
const base = built ? path.join(root, 'dist') : root;
const locales = ['en', 'es', 'ja', 'zh-Hant', 'de', 'pt', 'fr'];
const site = 'https://supuzz.com';
const sitemap = fs.readFileSync(path.join(built ? base : path.join(root, 'static'), 'sitemap.xml'), 'utf8');
const flatten = nodes => nodes.flatMap(node => typeof node === 'object' ? [node, ...flatten(node.content || [])] : []);
const nodesOf = file => flatten(parser(fs.readFileSync(file, 'utf8')));
const noindex = nodes => nodes.some(node => node.tag === 'meta'
  && /^(robots|googlebot)$/i.test(node.attrs?.name || '')
  && /\b(noindex|none)\b/i.test(node.attrs?.content || ''));
const refreshes = nodes => nodes.filter(node => node.tag === 'meta' && /^refresh$/i.test(node.attrs?.['http-equiv'] || ''));
const directories = ['', ...locales, ...(built ? [] : ['static', ...locales.map(locale => `static/${locale}`)])];
let count = 0;

for (const directory of directories) {
  for (const file of fs.readdirSync(path.join(base, directory)).filter(file => file.endsWith('.html'))) {
    const relative = path.posix.join(directory, file);
    const nodes = nodesOf(path.join(base, relative));
    const refresh = refreshes(nodes);
    if (!refresh.length) continue;
    assert.equal(refresh.length, 1, `${relative}: one redirect target`);
    assert(!noindex(nodes), `${relative}: redirects must not block indexing`);
    const destination = refresh[0].attrs.content.match(/^0\s*;\s*url=(.+)$/i)?.[1];
    assert(destination, `${relative}: use a zero-second permanent redirect`);
    const publicPath = relative.replace(/^static\//, '');
    const target = new URL(destination, `${site}/${publicPath}`);
    assert.equal(target.origin, site, `${relative}: redirect to the canonical HTTPS host`);
    const canonical = nodes.filter(node => node.tag === 'link' && node.attrs?.rel === 'canonical');
    assert.equal(canonical.length, 1, `${relative}: one canonical`);
    assert.equal(canonical[0].attrs.href, target.href, `${relative}: canonical and redirect must agree`);
    const targetFile = path.join(base, target.pathname.endsWith('/') ? `${target.pathname}index.html` : target.pathname);
    assert(fs.existsSync(targetFile), `${relative}: target must exist: ${target.pathname}`);
    const targetNodes = nodesOf(targetFile);
    assert(!noindex(targetNodes), `${relative}: target must be indexable`);
    assert.equal(refreshes(targetNodes).length, 0, `${relative}: avoid redirect chains`);
    const targetCanonical = targetNodes.filter(node => node.tag === 'link' && node.attrs?.rel === 'canonical');
    assert.equal(targetCanonical.length, 1, `${relative}: target must have one canonical`);
    assert.equal(targetCanonical[0].attrs.href, target.href, `${relative}: target must be self-canonical`);
    assert(sitemap.includes(`<loc>${target.href}</loc>`), `${relative}: target must be in the sitemap`);
    assert(!sitemap.includes(`<loc>${site}/${publicPath}</loc>`), `${relative}: omit redirects from the sitemap`);
    count++;
  }
}

assert(count > 0, 'Expected legacy redirects in the site');
const home = nodesOf(path.join(base, 'index.html'));
assert.equal(refreshes(home).length, 0, 'The root homepage must render directly');
assert(!noindex(home), 'The root homepage must allow indexing');
assert(home.some(node => node.tag === 'h1'), 'The root homepage must contain the English hero');
assert(home.some(node => node.attrs?.id === 'products'), 'The root homepage must contain the product collection');
assert(home.some(node => node.tag === 'base' && node.attrs?.href === '/en/'), 'Root navigation and assets must resolve to the English site');
assert(noindex(nodesOf(path.join(base, 'lang.html'))), 'The language chooser should remain noindex');
console.log(`PASS: ${count} ${built ? 'built' : 'source'} redirects allow crawling and point directly to indexable canonical pages in the sitemap.`);
