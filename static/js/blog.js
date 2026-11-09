import { apiService } from '../../api/api-service.js';

function initBlog() {
    const buttons = document.querySelectorAll('#blogFilters .filter-btn');
    const cards = document.querySelectorAll('#blogGridContainer .blog-card');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(item => {
                item.classList.remove('active');
                item.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            const category = button.dataset.filter;
            cards.forEach(card => {
                const visible = category === 'all' || card.dataset.category === category;
                card.style.display = visible ? '' : 'none';
            });
        });
    });
    apiService.pageview(window.location.pathname, document.referrer);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog, { once: true });
} else {
    initBlog();
}
