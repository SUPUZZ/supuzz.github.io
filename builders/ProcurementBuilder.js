const path = require('node:path');

class ProcurementBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['procurement']);
    }

    render({ text, shared, escape }) {
        const educationOffer = require(path.join(this.rootDir, 'resource/education-offer.json'));
        const offerLabel = text('education.offer').replaceAll('{discount}', String(educationOffer.discountPercent));
        return `
<main class="container procurement-page">
    <section class="procurement-hero">
        <p class="procurement-offer">${offerLabel}</p>
        <h1>${text('title')}</h1>
        <p>${text('intro')}</p>
    </section>

    <section class="procurement-scenarios" aria-label="${text('scenariosLabel')}">
        ${['education', 'gifts'].map((key, index) => `
        <div class="procurement-scenario">
            <span class="procurement-number" aria-hidden="true">0${index + 1}</span>
            <h2>${text(`${key}.title`)}</h2>
            <p>${text(`${key}.body`)}</p>
            <p class="procurement-detail">${text(`${key}.detail`)}</p>
            <a class="procurement-scenario-link" href="${escape(shared[`${key}ContactUrl`])}">${text(`${key}.cta`)}</a>
        </div>`).join('\n')}
    </section>

    <section class="procurement-request" aria-labelledby="request-heading">
        <h2 id="request-heading">${text('request.title')}</h2>
        <p>${text('request.intro')}</p>
        <ul>
            ${['organization', 'products', 'delivery'].map(key => `<li>${text(`request.details.${key}`)}</li>`).join('\n            ')}
        </ul>
        <p class="procurement-paperwork">${text('request.paperwork')}</p>
        <div class="procurement-actions">
            <a class="btn btn-tonal" href="${escape(shared.contactUrl)}">${text('request.cta')}</a>
            <a class="procurement-products" href="${escape(shared.productsUrl)}">${text('request.products')}</a>
        </div>
        <p class="procurement-next">${text('request.next')}</p>
    </section>
</main>`;
    }
}

module.exports = ProcurementBuilder;
if (require.main === module) new ProcurementBuilder().build();
