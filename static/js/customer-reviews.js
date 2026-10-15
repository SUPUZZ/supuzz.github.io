const track = document.querySelector('#review-track');
if (track) {
    const section = track.closest('.customer-reviews');
    const filters = section.querySelector('.review-filters');
    const navigation = section.querySelector('.reviews-navigation');
    const position = section.querySelector('[data-review-position]');
    const progress = section.querySelector('.review-progress');
    const thumb = section.querySelector('.review-progress-thumb');
    const previous = section.querySelector('[data-review-prev]');
    const next = section.querySelector('[data-review-next]');
    const cards = [...track.querySelectorAll('.review-card')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const visibleCards = () => cards.filter(card => !card.hidden);
    const update = () => {
        const matching = visibleCards();
        const maxScroll = track.scrollWidth - track.clientWidth;
        navigation.hidden = maxScroll <= 2;
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= maxScroll - 2;
        if (navigation.hidden) return;
        const bounds = track.getBoundingClientRect();
        const inView = matching.map((card, index) => {
            const rect = card.getBoundingClientRect();
            const overlap = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
            return overlap >= rect.width / 2 ? index : -1;
        }).filter(index => index !== -1);
        const first = inView[0] ?? 0;
        const last = inView.at(-1) ?? first;
        const label = `${String(first + 1).padStart(2, '0')}${last > first ? `–${String(last + 1).padStart(2, '0')}` : ''} / ${String(matching.length).padStart(2, '0')}`;
        if (position.textContent !== label) position.textContent = label;
        const fraction = Math.min(1, Math.max(0, track.scrollLeft / maxScroll));
        thumb.style.transform = `translateX(${fraction * (progress.clientWidth - thumb.offsetWidth)}px)`;
    };
    const move = direction => {
        const card = visibleCards()[0];
        if (!card) return;
        const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
        track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    filters.hidden = false;
    filters.addEventListener('click', event => {
        const button = event.target.closest('[data-review-filter]');
        if (!button) return;
        for (const filter of filters.querySelectorAll('button')) filter.setAttribute('aria-pressed', String(filter === button));
        for (const card of cards) card.hidden = button.dataset.reviewFilter !== 'all' && card.dataset.reviewCategory !== button.dataset.reviewFilter;
        track.scrollTo({ left: 0, behavior: 'instant' });
        update();
    });
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
    });
    let framePending = false;
    track.addEventListener('scroll', () => {
        if (framePending) return;
        framePending = true;
        requestAnimationFrame(() => { framePending = false; update(); });
    }, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
}
