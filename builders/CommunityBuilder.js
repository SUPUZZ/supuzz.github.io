const path = require('node:path');

const SOCIALS = [
    { label: 'TikTok', href: 'https://www.tiktok.com/@supuzz_us' },
    { label: 'Reddit', href: 'https://www.reddit.com/r/SUPUZZ/' },
    { label: 'X', href: 'https://x.com/SupuzzBrand' },
    { label: 'YouTube', href: 'https://www.youtube.com/@supuzz-studio' }
];

class CommunityBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['community']);
    }

    render({ text, escape, locale, content, shared }) {
        if (!Array.isArray(content.steps) || content.steps.length < 2) throw new Error('Missing community steps');
        if (!Array.isArray(content.faq) || !content.faq.length) throw new Error('Missing community FAQ');
        const messageKeys = ['submit', 'submitting', 'success', 'error', 'requiredTitle', 'requiredContent', 'requiredEmail', 'invalidImage', 'maxImages', 'imageCount'];
        for (const key of messageKeys) text('submit.form.' + key);
        const runtime = {
            submit: content.submit.form.submit,
            submitting: content.submit.form.submitting,
            success: content.submit.form.success,
            error: content.submit.form.error,
            requiredTitle: content.submit.form.requiredTitle,
            requiredContent: content.submit.form.requiredContent,
            requiredEmail: content.submit.form.requiredEmail,
            invalidImage: content.submit.form.invalidImage,
            maxImages: content.submit.form.maxImages,
            imageCount: content.submit.form.imageCount,
        };
        const steps = content.steps.map((_, index) => `
        <div class="community-step">
            <span class="community-step-num" aria-hidden="true">0${index + 1}</span>
            <h3>${text(`steps.${index}.title`)}</h3>
            <p>${text(`steps.${index}.body`)}</p>
        </div>`).join('');
        const faq = content.faq.map((_, index) => `
        <div class="community-faq-item">
            <h3>${text(`faq.${index}.q`)}</h3>
            <p>${text(`faq.${index}.a`)}</p>
        </div>`).join('');
        const socials = SOCIALS.map(social => `<a href="${escape(social.href)}" target="_blank" rel="noopener noreferrer">${escape(social.label)}</a>`).join('\n');
        return `
<main class="community-page">
    <section class="community-hero">
        <div class="community-hero-copy">
            <p class="community-eyebrow">${text('eyebrow')}</p>
            <h1>${text('title')}</h1>
            <p class="community-intro">${text('intro')}</p>
            <div class="community-trust">
                <span class="community-pill">${text('trust.review')}</span>
                <span class="community-pill">${text('trust.free')}</span>
            </div>
            <a class="community-hero-cta" href="#submit">${text('heroCta')} <span aria-hidden="true">↓</span></a>
        </div>
        <figure class="community-hero-visual">
            <img src="${escape(shared.image)}" alt="${text('imageAlt')}" width="${shared.imageWidth}" height="${shared.imageHeight}" loading="eager" fetchpriority="high">
            <figcaption>${text('heroCaption')}</figcaption>
        </figure>
    </section>

    <section class="community-steps" aria-labelledby="steps-title">
        <h2 id="steps-title" class="community-h2">${text('stepsTitle')}</h2>
        <div class="community-step-grid">${steps}
        </div>
    </section>

    <section class="community-submit" id="submit" aria-labelledby="submit-title">
        <p class="community-section-tag">${text('submit.tag')}</p>
        <h2 id="submit-title" class="community-h2">${text('submit.title')}</h2>
        <p class="community-lead">${text('submit.body')}</p>
        <form id="communityForm" data-language="${escape(locale.directory)}">
            <div class="community-field">
                <label for="communityTitle">${text('submit.form.titleLabel')}</label>
                <input id="communityTitle" name="title" type="text" maxlength="200" placeholder="${text('submit.form.titlePlaceholder')}" required>
            </div>
            <div class="community-field">
                <label for="communityBody">${text('submit.form.bodyLabel')}</label>
                <textarea id="communityBody" name="body" rows="5" maxlength="10000" placeholder="${text('submit.form.bodyPlaceholder')}"></textarea>
            </div>
            <div class="community-field">
                <label for="communityImage">${text('submit.form.imageLabel')}</label>
                <div class="community-dropzone" id="communityDropzone">
                    <input id="communityImage" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple>
                    <span class="community-dropzone-icon" aria-hidden="true">＋</span>
                    <span class="community-dropzone-hint">${text('submit.form.imageHint')}</span>
                    <span class="community-dropzone-count" id="communityImageCount" hidden></span>
                </div>
            </div>
            <div class="community-field">
                <label for="communitySocial">${text('submit.form.socialLabel')}</label>
                <input id="communitySocial" name="socialLink" type="url" placeholder="${text('submit.form.socialPlaceholder')}">
            </div>
            <div class="community-field">
                <label for="communityEmail">${text('submit.form.emailLabel')}</label>
                <input id="communityEmail" name="email" type="email" autocomplete="email" placeholder="${text('submit.form.emailPlaceholder')}" required>
            </div>
            <button type="submit" id="communitySubmit"><span class="community-submit-label">${text('submit.form.submit')}</span><span class="community-submit-arrow" aria-hidden="true">↗</span></button>
            <p class="community-note">${text('submit.form.note')} <a href="privacy.html">${text('submit.form.privacyLabel')}</a></p>
            <p id="communityMessage" role="status" aria-live="polite" hidden></p>
        </form>
    </section>

    <section class="community-faq" aria-labelledby="faq-title">
        <h2 id="faq-title" class="community-h2">${text('faqTitle')}</h2>
        <div class="community-faq-list">${faq}
        </div>
    </section>

    <section class="community-share" aria-labelledby="share-title">
        <div class="community-share-inner">
            <h2 id="share-title" class="community-h2">${text('share.title')}</h2>
            <p>${text('share.body')}</p>
            <p class="community-hashtag">${text('share.hashtag')}</p>
            <p class="community-socials">${socials}</p>
            <p class="community-fallback"><a href="contact.html">${text('share.fallback')}</a></p>
        </div>
    </section>

    <p class="community-links"><a href="index.html#products">${text('links.products')}</a> · <a href="blog.html">${text('links.blog')}</a></p>
</main>
<script type="application/json" id="communityMessages">${JSON.stringify(runtime).replaceAll('<', '\\u003c')}</script>
`;
    }

    structuredData({ content }) {
        if (!Array.isArray(content.faq) || !content.faq.length) throw new Error('Missing community FAQ');
        return [{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: content.faq.map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a }
            }))
        }];
    }
}

module.exports = CommunityBuilder;

if (require.main === module) new CommunityBuilder().build();
