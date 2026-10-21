const path = require('node:path');

// Owns the contact layout and builds every configured locale from the same code.
class ContactBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['contact']);
    }

    render({ text, shared, locale, escape, content }) {
        const educationOffer = require(path.join(this.rootDir, 'resource/education-offer.json'));
        const optionText = topic => text('form.options.' + topic).replaceAll('{discount}', String(educationOffer.discountPercent));
        const messageKeys = ['required', 'submitting', 'success', 'error'];
        const fieldKeys = ['name', 'inquiryType', 'message'];
        const topics = ['feedback', 'education', 'gifts', 'bulk', 'other'];
        for (const key of messageKeys) text('feedback.' + key);
        for (const key of fieldKeys) text('feedback.fields.' + key);
        for (const key of topics) text('form.messagePrompts.' + key);
        const messages = {
            ...Object.fromEntries(messageKeys.map(key => [key, content.feedback[key]])),
            fields: content.feedback.fields,
            submit: content.form.submit,
            messagePrompts: content.form.messagePrompts,
            defaultPrompt: content.form.placeholders.message,
            educationOffer
        };
        return `
<main class="contact-page">
    <h1>${text('title')}</h1>
    <p class="contact-intro">${text('intro')}</p>

    <form id="contactForm" data-language="${escape(locale.directory)}">
        <div class="contact-row">
            <div class="contact-field">
                <label for="name">${text('form.labels.name')}</label>
                <input type="text" id="name" name="name" autocomplete="name" required>
            </div>
            <div class="contact-field">
                <label for="email">${text('form.labels.email')}</label>
                <input type="email" id="email" name="email" autocomplete="email" required>
            </div>
        </div>
        <div class="contact-field">
            <label for="inquiryType">${text('form.labels.inquiryType')}</label>
            <select id="inquiryType" name="inquiryType" required>
                <option value="">${text('form.options.select')}</option>
                ${topics.map(topic => `<option value="${topic}">${optionText(topic)}</option>`).join('\n                ')}
            </select>
        </div>
        <div class="contact-field">
            <label for="message">${text('form.labels.message')}</label>
            <textarea id="message" name="message" required rows="5" placeholder="${text('form.placeholders.message')}"></textarea>
        </div>
        <div id="formMessage" role="status" aria-live="polite" hidden></div>
        <button type="submit" id="submitBtn">${text('form.submit')}</button>
    </form>

    <p class="contact-email">${text('emailAlternative')} <a href="mailto:${escape(shared.email)}">${escape(shared.email)}</a></p>
</main>
<script type="application/json" id="contactMessages">${JSON.stringify(messages).replaceAll('<', '\\u003c')}</script>
`;
    }

    structuredData({ shared, locale }) {
        return [{
            '@context': 'https://schema.org', '@type': 'Organization', name: 'SUPUZZ',
            url: 'https://supuzz.com/' + locale.directory + '/',
            logo: 'https://supuzz.com' + shared.logo, email: shared.email,
            contactPoint: ['Customer Support', 'Product Feedback', 'Bulk Orders'].map(contactType => ({
                '@type': 'ContactPoint', contactType, email: shared.email, availableLanguage: shared.availableLanguages
            })),
            address: { '@type': 'PostalAddress', addressCountry: 'CN' }
        }];
    }
}

module.exports = ContactBuilder;

if (require.main === module) new ContactBuilder().build();
