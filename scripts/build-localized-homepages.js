// Apply the approved homepage composition without replacing localized SEO or product content.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const translations = require('../resource/homepage-locales.json');
const { locales } = require('./product-localization');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

for (const locale of locales.filter(locale => locale.directory !== 'en')) {
  const file = path.join(root, locale.directory, 'index.html');
  let home = fs.readFileSync(file, 'utf8');
  const h = translations[locale.directory].hero;
  const worlds = [
    ['product-ocean-building-blocks-l1.html', locale.names[2]],
    ['product-icy-world-l1.html', locale.names[3]],
    ['product-dinosaur-jungle-l1.html', locale.names[1]],
    ['product-waffle-building-blocks-128.html', locale.names[0]]
  ];
  const hero = `<section id="home" class="hero">
        <div class="container">
            <div class="hero-grid">
                <div class="hero-content">
                    <p class="home-eyebrow">${escape(h.eyebrow)}</p>
                    <h1>${escape(h.title)}<br><span>${escape(h.accent)}</span></h1>
                    <p class="hero-description">${escape(h.description)}</p>
                    ${h.future ? `<a href="future.html" class="hero-future">${escape(h.future)} <span aria-hidden="true">↗</span></a>` : ''}
                </div>
                <figure class="hero-img">
                    <span class="hero-image-label">${escape(h.imageLabel)}</span>
                    <img src="/product-images/supuzz-coral-reef-l3-main.webp" alt="${escape(h.imageAlt)}" fetchpriority="high" loading="eager" width="1200" height="1016">
                    <figcaption><span>${escape(h.collection)}</span><strong>${escape(h.caption)}</strong><span class="hero-image-spark" aria-hidden="true">✳</span></figcaption>
                </figure>
            </div>
            <div class="hero-worlds"><span>${escape(h.worlds)}</span><div>${worlds.map(([url, name]) => `<a href="${url}">${escape(name)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div>
        </div>
    </section>`.replace(/[ \t]+$/gm, '');
  const pattern = /<section id="home" class="hero">[\s\S]*?<\/section>/;
  if (!pattern.test(home)) throw new Error(`Missing homepage hero: ${locale.directory}`);
  home = home.replace(pattern, hero).replace('<body>', '<body class="home-page">');
  for (const css of ['customer-reviews', 'home-journal', 'home-page']) {
    if (!home.includes(`href="../css/${css}.css"`)) home = home.replace('    <!-- Favicons', `    <link rel="stylesheet" href="../css/${css}.css">\n\n    <!-- Favicons`);
    // The French page has no favicon comment.
    if (!home.includes(`href="../css/${css}.css"`)) home = home.replace('</head>', `    <link rel="stylesheet" href="../css/${css}.css">\n</head>`);
  }
  if (!home.includes('src="/js/customer-reviews.js"')) home = home.replace('</body>', '    <script type="module" src="/js/customer-reviews.js"></script>\n</body>');
  // Use the same working analytics import as the other localized homepages.
  home = home.replace('from "../api-service.js"', 'from "../api/api-service.js"');
  home = home.replace(/(?:if \(typeof CurrencyConverter !== 'undefined'\) )*await CurrencyConverter.updatePrices\('es'\);/g, "if (typeof CurrencyConverter !== 'undefined') await CurrencyConverter.updatePrices('es');");
  fs.writeFileSync(file, home);
  console.log(`Updated ${locale.directory} homepage composition.`);
}
