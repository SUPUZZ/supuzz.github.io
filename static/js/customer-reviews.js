const track = document.querySelector('#review-track');
if (track) {
    const controls = document.querySelector('.review-controls');
    const previous = controls.querySelector('[data-review-prev]');
    const next = controls.querySelector('[data-review-next]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
        const overflow = track.scrollWidth > track.clientWidth + 2;
        controls.hidden = !overflow;
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const move = (direction) => {
        const card = track.querySelector('.review-card');
        const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
        track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', (event) => {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
    });
    track.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(track);
    update();
}
