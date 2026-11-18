import { apiService } from '../../api/api-service.js';

function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const submitBtn = document.getElementById('newsletterSubmit');
    const emailInput = document.getElementById('newsletterEmail');
    const messageEl = document.getElementById('newsletterMessage');
    const messagesEl = document.getElementById('newsletterMessages');
    if (!form || !submitBtn || !emailInput || !messageEl || !messagesEl) return;

    const messages = JSON.parse(messagesEl.textContent);
    const urlSource = new URLSearchParams(window.location.search).get('source');
    const source = urlSource || form.dataset.source || 'newsletter';
    const language = form.dataset.language;

    apiService.pageview(window.location.pathname, document.referrer);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;

        const email = emailInput.value.trim();
        if (!email) {
            showMessage(messages.required, 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = messages.submitting;
        messageEl.hidden = true;

        try {
            await apiService.subscribe(email, { source, language });
            showMessage(messages.success, 'success');
            form.reset();
        } catch (error) {
            showMessage(messages.error, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = messages.submit;
        }
    });

    function showMessage(message, type) {
        messageEl.textContent = message;
        messageEl.hidden = false;
        messageEl.style.background = type === 'success' ? '#C4EED0' : '#F9DEDC';
        messageEl.style.color = type === 'success' ? '#005221' : '#B3261E';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterForm, { once: true });
} else {
    initNewsletterForm();
}
