import { apiService } from '../../api/api-service.js';

function trackArticlePage() {
    apiService.pageview(window.location.pathname, document.referrer);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackArticlePage, { once: true });
} else {
    trackArticlePage();
}
