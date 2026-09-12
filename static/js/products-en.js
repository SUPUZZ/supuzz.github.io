// Links and content remain usable without JavaScript.
document.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
  const mainLink = gallery.querySelector('.product-gallery-main');
  const mainImage = mainLink.querySelector('img');
  gallery.querySelectorAll('[data-gallery-image]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      mainImage.src = link.href;
      mainImage.removeAttribute('srcset');
      mainImage.alt = link.querySelector('img').alt;
      mainLink.href = link.href;
      gallery.querySelectorAll('[data-gallery-image]').forEach((item) => {
        item.setAttribute('aria-current', String(item === link));
      });
    });
  });
});

const filters = document.querySelector('[data-product-filters]');
if (filters) {
  const cards = [...document.querySelectorAll('#product-grid [data-category]')];
  const count = document.querySelector('[data-product-count]');
  filters.hidden = false;
  filters.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      filters.querySelectorAll('button').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      cards.forEach((card) => {
        card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      });
      const visible = cards.filter((card) => !card.hidden).length;
      count.textContent = `${visible} ${visible === 1 ? count.dataset.singular : count.dataset.plural}`;
    });
  });
}
