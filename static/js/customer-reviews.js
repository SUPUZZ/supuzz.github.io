const track = document.querySelector('#review-track');
if (track) {
    const section = track.closest('.customer-reviews');
    const controls = section.querySelector('.review-controls');
    const filters = section.querySelector('.review-filters');
    const previous = controls.querySelector('[data-review-prev]');
    const next = controls.querySelector('[data-review-next]');
    const cards = [...track.querySelectorAll('.review-card')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
        controls.hidden = track.scrollWidth <= track.clientWidth + 2;
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const move = direction => {
        const card = cards.find(card => !card.hidden);
        if (!card) return;
        const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
        track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    filters.hidden = false;
    filters.addEventListener('click', event => {
        const button = event.target.closest('[data-review-filter]');
        if (!button) return;
        const category = button.dataset.reviewFilter;
        for (const filter of filters.querySelectorAll('button')) filter.setAttribute('aria-pressed', String(filter === button));
        for (const card of cards) card.hidden = category !== 'all' && card.dataset.reviewCategory !== category;
        track.scrollTo({ left: 0, behavior: 'instant' });
        const count = cards.filter(card => !card.hidden).length;
        section.querySelector('[data-review-count]').textContent = `${count} ${count === 1 ? 'story' : 'stories'}`;
        update();
    });
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
    });
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
}
