const path = require('node:path');

const PRODUCT_STYLES = {
    building: { icon: 'extension', color: '#8A6D00', border: '#FEDD00' },
    ocean: { icon: 'waves', color: '#2B6A8F', border: '#9CC7DD' },
    ice: { icon: 'ac_unit', color: '#4A7C8C', border: '#BFE3EA' },
    forest: { icon: 'forest', color: '#3F6B3A', border: '#C4EED0' },
    rainbow: { icon: 'grid_view', color: '#BF4638', border: '#F2B8A8' },
    furniture: { icon: 'chair', color: '#8A6D00', border: '#FEDD00' }
};

class AboutBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['about']);
    }

    render({ text, shared, escape, content }) {
        if (typeof shared.slogan !== 'string' || !shared.slogan.trim()) throw new Error('Missing about slogan');
        for (const field of ['productsUrl', 'puzzleUrl', 'communityUrl', 'blogUrl', 'contactUrl', 'procurementUrl']) {
            if (typeof shared[field] !== 'string' || !shared[field].trim()) throw new Error(`Missing about link: ${field}`);
        }
        for (const field of ['open', 'puzzle', 'community']) {
            const image = shared.images?.[field];
            if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height)) {
                throw new Error(`Missing about image: ${field}`);
            }
        }

        const paragraphs = (section, required = true) => {
            const sectionContent = section.split('.').reduce((value, part) => value?.[part], content);
            const values = sectionContent?.paragraphs;
            if (!Array.isArray(values) || (required && !values.length)) {
                throw new Error(`Missing about ${section} paragraphs`);
            }
            return values.map((_, index) => `<p>${text(`${section}.paragraphs.${index}`)}</p>`).join('\n');
        };
        const items = (key, minimum, label) => {
            const values = key.split('.').reduce((value, part) => value?.[part], content);
            if (!Array.isArray(values) || values.length < minimum) throw new Error(`Missing about ${label}`);
            return values;
        };

        const heroFacts = items('hero.facts', 3, 'hero facts');
        const beliefPoints = items('belief.points', 3, 'belief points');
        const missionSteps = items('mission.steps', 3, 'mission steps');
        const productItems = items('products.items', 6, 'product items');
        const brandValues = items('brand.values', 3, 'brand values');
        const faqItems = items('faq.items', 4, 'FAQ items');
        for (const item of productItems) {
            if (!PRODUCT_STYLES[item.key]) throw new Error(`Unknown about product key: ${item.key}`);
        }
        if (productItems.length !== Object.keys(PRODUCT_STYLES).length) throw new Error('About product items must match product styles');

        const cardMarkup = productItems.map((item, index) => {
            const style = PRODUCT_STYLES[item.key];
            return `
            <article class="about-card" style="border-top-color: ${style.border};">
                <span class="material-symbols-rounded" style="color: ${style.color};" aria-hidden="true">${style.icon}</span>
                <h3>${text(`products.items.${index}.title`)}</h3>
                <p>${text(`products.items.${index}.body`)}</p>
            </article>`;
        }).join('');

        const principleMarkup = beliefPoints.map((_, index) => `
            <article class="about-principle">
                <span class="about-principle-index" aria-hidden="true">0${index + 1}</span>
                <h3>${text(`belief.points.${index}.title`)}</h3>
                <p>${text(`belief.points.${index}.body`)}</p>
            </article>`).join('');

        const stepMarkup = missionSteps.map((_, index) => `
                <li>${text(`mission.steps.${index}`)}</li>`).join('');

        const valueMarkup = brandValues.map((_, index) => `
            <article class="about-value">
                <h3>${text(`brand.values.${index}.title`)}</h3>
                <p>${text(`brand.values.${index}.body`)}</p>
            </article>`).join('');

        const faqMarkup = faqItems.map((_, index) => `
            <article class="about-faq-item">
                <h3>${text(`faq.items.${index}.q`)}</h3>
                <p>${text(`faq.items.${index}.a`)}</p>
            </article>`).join('');

        const heroSrcset = typeof shared.imageSrcset === 'string' && shared.imageSrcset.trim()
            ? ` srcset="${escape(shared.imageSrcset)}" sizes="(max-width: 900px) 92vw, 520px"`
            : '';
        const openImage = shared.images.open;
        const puzzleImage = shared.images.puzzle;
        const communityImage = shared.images.community;

        return `
<main class="container about-page">
    <section class="about-hero" aria-labelledby="about-title">
        <div class="about-hero-copy">
            <nav class="about-breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="index.html">${text('homeLabel')}</a></li>
                    <li aria-current="page">${text('hero.eyebrow')}</li>
                </ol>
            </nav>
            <h1 id="about-title" lang="en">${text('hero.title')}</h1>
            <p class="about-hero-subtitle">${text('hero.subtitle')}</p>
            <p class="about-hero-lead">${text('hero.lead')}</p>
            <div class="about-actions">
                <a class="btn about-btn-primary" href="${escape(shared.productsUrl)}">
                    ${text('hero.primaryCta')}
                    <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                </a>
                <a class="btn about-btn-secondary" href="${escape(shared.puzzleUrl)}">
                    ${text('hero.secondaryCta')}
                    <span class="material-symbols-rounded" aria-hidden="true">extension</span>
                </a>
            </div>
            <ul class="about-hero-facts">
                ${heroFacts.map((_, index) => `<li>${text(`hero.facts.${index}`)}</li>`).join('\n                ')}
            </ul>
        </div>
        <figure class="about-hero-figure">
            <img src="${escape(shared.image)}"${heroSrcset} alt="${text('imageAlt')}" width="${shared.imageWidth}" height="${shared.imageHeight}" loading="eager" fetchpriority="high" decoding="async">
            <figcaption>${text('hero.imageCaption')}</figcaption>
        </figure>
    </section>

    <section class="about-section about-story" id="story" aria-labelledby="story-title">
        <div class="about-section-head about-section-head--center">
            <p class="about-eyebrow">${text('story.eyebrow')}</p>
            <h2 id="story-title">${text('story.title')}</h2>
        </div>
        <div class="about-story-copy">
            ${paragraphs('story')}
            <blockquote class="about-pullquote">
                <p>${text('story.quote')}</p>
            </blockquote>
        </div>
    </section>

    <section class="about-section about-belief" id="belief" aria-labelledby="belief-title">
        <div class="about-belief-inner">
            <div class="about-section-head">
                <p class="about-eyebrow">${text('belief.eyebrow')}</p>
                <h2 id="belief-title">${text('belief.title')}</h2>
                <p class="about-lead">${text('belief.intro')}</p>
            </div>
            <div class="about-principles">${principleMarkup}
            </div>
            <p class="about-belief-outro">${text('belief.outro')}</p>
        </div>
    </section>

    <section class="about-section about-mission" id="mission" aria-labelledby="mission-title">
        <div class="about-mission-grid">
            <div class="about-section-head">
                <p class="about-eyebrow">${text('mission.eyebrow')}</p>
                <h2 id="mission-title">${text('mission.title')}</h2>
            </div>
            <div class="about-mission-body">
                ${paragraphs('mission')}
                <ol class="about-mission-steps">${stepMarkup}
                </ol>
            </div>
        </div>
    </section>

    <section class="about-section about-products" id="products" aria-labelledby="products-title">
        <div class="about-section-head about-section-head--center">
            <p class="about-eyebrow">${text('products.eyebrow')}</p>
            <h2 id="products-title">${text('products.title')}</h2>
            <p class="about-lead">${text('products.intro')}</p>
        </div>
        <div class="about-cards">${cardMarkup}
        </div>
        <p class="about-section-action">
            <a class="btn about-btn-primary" href="${escape(shared.productsUrl)}">
                ${text('products.cta')}
                <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
            </a>
        </p>
    </section>

    <section class="about-section about-ways" id="ways-to-play" aria-labelledby="ways-title">
        <div class="about-section-head">
            <p class="about-eyebrow">${text('ways.eyebrow')}</p>
            <h2 id="ways-title">${text('ways.title')}</h2>
        </div>
        <div class="about-way-grid">
            <article class="about-way about-way--open">
                <img src="${escape(openImage.src)}" alt="${text('ways.open.imageAlt')}" width="${openImage.width}" height="${openImage.height}" loading="lazy" decoding="async">
                <h3>${text('ways.open.title')}</h3>
                ${paragraphs('ways.open')}
                <p class="about-way-emphasis">${text('ways.open.emphasis')}</p>
                <a class="about-textlink" href="${escape(shared.blogUrl)}">
                    ${text('ways.open.cta')}
                    <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                </a>
            </article>
            <article class="about-way about-way--digital">
                <img src="${escape(puzzleImage.src)}" alt="${text('ways.digital.imageAlt')}" width="${puzzleImage.width}" height="${puzzleImage.height}" loading="lazy" decoding="async">
                <h3>${text('ways.digital.title')}</h3>
                ${paragraphs('ways.digital')}
                <a class="about-textlink" href="${escape(shared.puzzleUrl)}">
                    ${text('ways.digital.cta')}
                    <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                </a>
            </article>
        </div>
    </section>

    <section class="about-section about-community" id="community" aria-labelledby="community-title">
        <div class="about-community-grid">
            <img src="${escape(communityImage.src)}" alt="${text('community.imageAlt')}" width="${communityImage.width}" height="${communityImage.height}" loading="lazy" decoding="async">
            <div class="about-community-copy">
                <p class="about-eyebrow">${text('community.eyebrow')}</p>
                <h2 id="community-title">${text('community.title')}</h2>
                ${paragraphs('community')}
                <a class="btn about-btn-secondary" href="${escape(shared.communityUrl)}">
                    ${text('community.cta')}
                    <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                </a>
            </div>
        </div>
    </section>

    <section class="about-section about-brand" aria-labelledby="brand-title">
        <div class="about-section-head about-section-head--center">
            <p class="about-eyebrow">${text('brand.eyebrow')}</p>
            <h2 id="brand-title">${text('brand.title')}</h2>
        </div>
        <div class="about-values">${valueMarkup}
        </div>
        <div class="about-brand-copy">
            ${paragraphs('brand')}
        </div>
    </section>

    <section class="about-section about-partners" aria-labelledby="partners-title">
        <div class="about-partners-card">
            <div class="about-partners-copy">
                <h2 id="partners-title">${text('partners.title')}</h2>
                <p>${text('partners.body')}</p>
            </div>
            <div class="about-actions">
                <a class="btn about-btn-primary" href="${escape(shared.contactUrl)}">
                    ${text('partners.primaryCta')}
                    <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
                </a>
                <a class="about-textlink" href="${escape(shared.procurementUrl)}">${text('partners.secondaryCta')}</a>
            </div>
        </div>
    </section>

    <section class="about-section about-faq" id="faq" aria-labelledby="faq-title">
        <div class="about-section-head">
            <p class="about-eyebrow">${text('faq.eyebrow')}</p>
            <h2 id="faq-title">${text('faq.title')}</h2>
        </div>
        <div class="about-faq-list">${faqMarkup}
        </div>
    </section>

    <section class="about-final" aria-labelledby="final-title">
        <div class="about-final-inner">
            <p class="about-eyebrow">${text('final.eyebrow')}</p>
            <h2 id="final-title">${text('final.title')}</h2>
            <p class="about-final-body">${text('final.body')}</p>
            <div class="about-actions about-actions--center">
                <a class="btn about-btn-dark" href="${escape(shared.productsUrl)}">${text('final.primaryCta')}</a>
                <a class="btn about-btn-white" href="${escape(shared.puzzleUrl)}">${text('final.secondaryCta')}</a>
                <a class="about-textlink about-textlink--dark" href="${escape(shared.blogUrl)}">${text('final.tertiaryCta')}</a>
            </div>
            <p class="about-final-signature">${text('final.signature')}</p>
        </div>
    </section>
</main>`;
    }

    structuredData({ shared, content, locale, url }) {
        const faq = content.faq?.items;
        if (!Array.isArray(faq) || faq.length < 4) throw new Error('Missing about FAQ');
        return [{
            '@context': 'https://schema.org', '@type': 'Organization', '@id': 'https://supuzz.com/#organization',
            name: 'SUPUZZ',
            url: `https://supuzz.com/${locale.directory}/`,
            logo: 'https://supuzz.com' + shared.logo,
            description: content.description,
            slogan: shared.slogan,
            address: { '@type': 'PostalAddress', addressCountry: shared.addressCountry },
            sameAs: shared.sameAs
        }, {
            '@context': 'https://schema.org', '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem', position: 1, name: content.homeLabel,
                    item: `https://supuzz.com/${locale.directory}/`
                },
                { '@type': 'ListItem', position: 2, name: content.title, item: url }
            ]
        }, {
            '@context': 'https://schema.org', '@type': 'FAQPage',
            mainEntity: faq.map(item => ({
                '@type': 'Question', name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a }
            }))
        }];
    }
}

module.exports = AboutBuilder;

if (require.main === module) new AboutBuilder().build();
