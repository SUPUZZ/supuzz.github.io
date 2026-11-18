const path = require('node:path');

class NewsletterBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['newsletter']);
    }

    render({ text, locale, escape, content }) {
        if (!Array.isArray(content.benefits) || content.benefits.length < 2) throw new Error('Missing newsletter benefits');
        for (const key of ['required', 'submitting', 'success', 'error']) text('messages.' + key);
        text('form.submit');
        const runtime = {
            submit: content.form.submit,
            required: content.messages.required,
            submitting: content.messages.submitting,
            success: content.messages.success,
            error: content.messages.error,
        };
        return `
<main class="newsletter-page">
    <section class="newsletter-hero">
        <p class="newsletter-eyebrow">${text('eyebrow')}</p>
        <h1>${text('headline')}</h1>
        <p class="newsletter-subhead">${text('subhead')}</p>
    </section>

    <section class="newsletter-benefits" aria-label="${text('benefitsLabel')}">
        ${content.benefits.map((_, index) => `
        <div class="newsletter-benefit">
            <h2>${text(`benefits.${index}.title`)}</h2>
            <p>${text(`benefits.${index}.body`)}</p>
        </div>`).join('\n')}
    </section>

    <section class="newsletter-form-wrap">
        <p class="newsletter-proof">${text('socialProof')}</p>
        <form id="newsletterForm" data-source="newsletter" data-language="${escape(locale.directory)}">
            <label class="newsletter-field">
                <span>${text('form.label')}</span>
                <input type="email" id="newsletterEmail" name="email" autocomplete="email" inputmode="email" placeholder="${text('form.placeholder')}" required>
            </label>
            <button type="submit" id="newsletterSubmit">${text('form.submit')}</button>
            <p class="newsletter-note">${text('form.note')} <a href="privacy.html">${text('form.privacyLabel')}</a></p>
            <p id="newsletterMessage" role="status" aria-live="polite" hidden></p>
        </form>
    </section>
</main>
<script type="application/json" id="newsletterMessages">${JSON.stringify(runtime).replaceAll('<', '\\u003c')}</script>
`;
    }
}

module.exports = NewsletterBuilder;

if (require.main === module) new NewsletterBuilder().build();
