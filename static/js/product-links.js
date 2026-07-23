const configUrl = '/data/product-links.json';

function languageCode() {
  return document.documentElement.lang || 'en';
}

function purchaseLabel(labels) {
  const language = languageCode();
  return labels[language] || labels[language.split('-')[0]] || labels.en;
}

function updateLink(link, product, label) {
  if (!link || !product.url) return;

  link.href = product.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = label;
  link.setAttribute('aria-label', `${label}: ${product.asin}`);
}

function updateCardLink(card, product, label) {
  if (!card) return;
  updateLink(card.querySelector('a.btn, a.btn-tonal'), product, label);
}

async function applyProductLinks() {
  try {
    const response = await fetch(configUrl, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Unable to load product links: ${response.status}`);

    const config = await response.json();
    const label = purchaseLabel(config.purchaseLabels);

    document.querySelectorAll('[data-product-link]').forEach((link) => {
      updateLink(link, config.products[link.dataset.productLink], label);
    });

    config.homeCardMappings.forEach(({ imageToken, product: productKey }) => {
      const image = document.querySelector(`.product-card img[src*="${imageToken}"]`);
      const product = config.products[productKey];
      if (image && product) updateCardLink(image.closest('.product-card'), product, label);
    });
  } catch (error) {
    console.warn('Amazon product links were not updated:', error.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyProductLinks, { once: true });
} else {
  applyProductLinks();
}
