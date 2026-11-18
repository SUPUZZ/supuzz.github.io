const path = require('node:path');
const locales = require('../resource/newsletter-cta-locales.json');

// Shared inline call-to-action for article pages. The CTA links to the
// newsletter landing page with a source tag so signups can be attributed.
function renderCta(localeDirectory, escape, source = 'article') {
  const copy = locales[localeDirectory] || locales.en;
  const field = name => {
    const value = copy[name];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing newsletter CTA text: ${localeDirectory}/${name}`);
    return escape(value);
  };
  return `<aside class="newsletter-cta" aria-labelledby="newsletter-cta-title">
    <p class="newsletter-cta-eyebrow">${field('eyebrow')}</p>
    <h2 id="newsletter-cta-title">${field('heading')}</h2>
    <p>${field('body')}</p>
    <a class="newsletter-cta-btn" href="newsletter.html?source=${escape(source)}">${field('button')} <span aria-hidden="true">↗</span></a>
</aside>`;
}

module.exports = { renderCta };
