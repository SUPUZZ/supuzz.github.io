import { apiService } from '../../api/api-service.js';

const BRAND_NAME = 'supuzz-us';
const DOMAIN = 'supuzz.com';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 5;

function initCommunityForm() {
    const form = document.getElementById('communityForm');
    const submitBtn = document.getElementById('communitySubmit');
    const messageEl = document.getElementById('communityMessage');
    const messagesEl = document.getElementById('communityMessages');
    if (!form || !submitBtn || !messageEl || !messagesEl) return;

    const messages = JSON.parse(messagesEl.textContent);
    const language = form.dataset.language;
    const source = new URLSearchParams(window.location.search).get('source') || 'community';

    const imageInput = document.getElementById('communityImage');
    const dropzone = document.getElementById('communityDropzone');
    const imageCountEl = document.getElementById('communityImageCount');
    const submitLabel = submitBtn.querySelector('.community-submit-label') || submitBtn;

    function updateImageCount() {
        if (!imageCountEl || !imageInput) return;
        const count = imageInput.files ? imageInput.files.length : 0;
        if (count > 0) {
            imageCountEl.hidden = false;
            imageCountEl.textContent = (messages.imageCount || '{n}').replace('{n}', String(count));
        } else {
            imageCountEl.hidden = true;
            imageCountEl.textContent = '';
        }
    }

    if (imageInput) imageInput.addEventListener('change', updateImageCount);
    if (dropzone) {
        dropzone.addEventListener('dragover', (event) => event.preventDefault());
        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
                try {
                    imageInput.files = event.dataTransfer.files;
                    updateImageCount();
                } catch (error) {
                    // Some browsers block assigning files; native drop still applies.
                }
            }
        });
    }

    apiService.pageview(window.location.pathname, document.referrer);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitBtn.disabled) return;

        const title = document.getElementById('communityTitle').value.trim();
        const body = document.getElementById('communityBody').value.trim();
        const socialLink = document.getElementById('communitySocial').value.trim();
        const email = document.getElementById('communityEmail').value.trim();
        const files = Array.from(imageInput.files || []);

        if (!title) {
            show(messages.requiredTitle, 'error');
            return;
        }
        if (!body && files.length === 0 && !socialLink) {
            show(messages.requiredContent, 'error');
            return;
        }
        if (!email) {
            show(messages.requiredEmail, 'error');
            return;
        }
        if (files.length > MAX_IMAGES) {
            show(messages.maxImages, 'error');
            return;
        }
        if (files.some(file => !ALLOWED_IMAGE_TYPES.includes(file.type))) {
            show(messages.invalidImage, 'error');
            return;
        }

        const formData = new FormData();
        formData.append('brandName', BRAND_NAME);
        formData.append('domain', DOMAIN);
        formData.append('title', title);
        if (body) formData.append('body', body);
        if (socialLink) formData.append('socialLink', socialLink);
        formData.append('email', email);
        formData.append('source', source);
        formData.append('language', language);
        files.forEach(file => formData.append('image', file));

        submitBtn.disabled = true;
        submitLabel.textContent = messages.submitting;
        messageEl.hidden = true;

        try {
            await apiService.submitCommunity(formData);
            show(messages.success, 'success');
            form.reset();
            updateImageCount();
        } catch (error) {
            const message = error && error.message && error.message !== 'Failed to submit'
                ? error.message
                : messages.error;
            show(message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitLabel.textContent = messages.submit;
        }
    });

    function show(message, type) {
        messageEl.textContent = message;
        messageEl.hidden = false;
        messageEl.style.background = type === 'success' ? '#C4EED0' : '#F9DEDC';
        messageEl.style.color = type === 'success' ? '#005221' : '#B3261E';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommunityForm, { once: true });
} else {
    initCommunityForm();
}
