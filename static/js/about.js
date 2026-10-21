import { apiService } from '../../api/api-service.js';

function trackAboutPage() {
    apiService.pageview(window.location.pathname, document.referrer);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackAboutPage, { once: true });
} else {
    trackAboutPage();
}
