import { apiService } from '../../api/api-service.js';

// Shared behavior; every visible message comes from the generated locale content.
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');
    const messages = JSON.parse(document.getElementById('contactMessages').textContent);
    const language = form.dataset.language;
    const topicInput = document.getElementById('inquiryType');
    const messageInput = document.getElementById('message');

    function updateMessagePrompt() {
        messageInput.placeholder = messages.messagePrompts[topicInput.value] || messages.defaultPrompt;
    }

    topicInput.addEventListener('change', updateMessagePrompt);
    updateMessagePrompt();

    apiService.pageview(window.location.pathname, document.referrer);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;

        const value = id => document.getElementById(id).value.trim();
        const name = value('name');
        const email = value('email');
        const inquiryType = value('inquiryType');
        const detail = value('message');

        if (!name || !email || !inquiryType || !detail) {
            showMessage(messages.required, 'error');
            return;
        }

        const message = [
            `${messages.fields.name}${name}`,
            `${messages.fields.inquiryType}${inquiryType}`,
            `${messages.fields.message}${detail}`,
        ].join('\n');

        submitBtn.disabled = true;
        submitBtn.textContent = messages.submitting;
        formMessage.hidden = true;

        try {
            await apiService.feedback({
                email,
                message,
                source: `contact-${language}`,
                metadata: { lang: language, page: window.location.pathname },
            });
            showMessage(messages.success, 'success');
            form.reset();
            updateMessagePrompt();
        } catch (error) {
            showMessage(messages.error, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = messages.submit;
        }
    });

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.hidden = false;
        formMessage.style.background = type === 'success' ? '#C4EED0' : '#F9DEDC';
        formMessage.style.color = type === 'success' ? '#005221' : '#B3261E';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm, { once: true });
} else {
    initContactForm();
}
