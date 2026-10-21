const path = require('node:path');

class AboutBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['about']);
    }

    render({ text, shared, escape, content }) {
        if (typeof shared.slogan !== 'string' || !shared.slogan.trim()) throw new Error('Missing about slogan');
        const paragraphs = (section, required = true) => {
            const values = content[section]?.paragraphs;
            if (!Array.isArray(values) || (required && !values.length)) {
                throw new Error(`Missing about ${section} paragraphs`);
            }
            return values.map((_, index) => `<p>${text(`${section}.paragraphs.${index}`)}</p>`).join('\n');
        };
        const cards = [
            { key: 'blocks', icon: 'extension', color: '#6750A4', border: '#6750A4' },
            { key: 'furniture', icon: 'chair', color: '#B3861F', border: '#FEDD00' },
            { key: 'play', icon: 'psychology', color: '#005221', border: '#C4EED0' }
        ];
        return `
<main class="container about-page">
    <section class="about-hero">
        <h1>${text('title')}</h1>
        <p>${text('intro')}</p>
    </section>

    <section class="about-section about-philosophy">
        <div class="about-copy">
            <h2 lang="en">${escape(shared.slogan)}</h2>
            ${paragraphs('philosophy')}
        </div>
        <img src="${escape(shared.image)}" alt="${text('imageAlt')}" width="${shared.imageWidth}" height="${shared.imageHeight}" loading="lazy">
    </section>

    <section class="about-section about-offerings">
        <h2>${text('offerings.title')}</h2>
        ${paragraphs('offerings', false)}
        <div class="about-cards">
            ${cards.map(({ key, icon, color, border }) => `
            <div class="about-card" style="border-top-color: ${border};">
                <span class="material-symbols-rounded" style="color: ${color};" aria-hidden="true">${icon}</span>
                <h3>${text(`offerings.cards.${key}.title`)}</h3>
                <p>${text(`offerings.cards.${key}.body`)}</p>
            </div>`).join('\n')}
        </div>
    </section>

    <section class="about-section about-copy about-cta">
        <h2>${text('cta.title')}</h2>
        <p>${text('cta.body')}</p>
        <a href="${escape(shared.contactUrl)}" class="btn btn-tonal">
            ${text('cta.label')}
            <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
        </a>
    </section>
</main>`;
    }

    structuredData({ shared, content, locale }) {
        return [{
            '@context': 'https://schema.org', '@type': 'Organization', name: 'SUPUZZ',
            url: `https://supuzz.com/${locale.directory}/`,
            logo: 'https://supuzz.com' + shared.logo,
            description: content.description,
            address: { '@type': 'PostalAddress', addressCountry: shared.addressCountry },
            sameAs: shared.sameAs
        }];
    }
}

module.exports = AboutBuilder;

if (require.main === module) new AboutBuilder().build();
