const path = require('node:path');

class BuildingBlocksPremiumBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['building-blocks-premium']);
    }

    render({ text, shared, content, locale, escape }) {
        const publishedDate = new Intl.DateTimeFormat(locale.htmlLang, {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        }).format(new Date(shared.datePublished));
        const entries = key => {
            const values = key.split('.').reduce((value, part) => value?.[part], content);
            if (!Array.isArray(values) || !values.length) throw new Error(`Missing building blocks content: ${key}`);
            return values;
        };
        const paragraphs = key => entries(key).map((_, index) => `<p>${text(`${key}.${index}`)}</p>`).join('\n');
        const section = key => `<section aria-labelledby="${key}-title">
            <h2 id="${key}-title">${text(`${key}.title`)}</h2>
            ${paragraphs(`${key}.paragraphs`)}
        </section>`;
        const figure = (image, key, eager = false) => `<figure>
            <img class="${eager ? 'featured-img' : 'detail-img'}" src="${escape(image.src)}" alt="${text(`${key}.alt`)}" width="${image.width}" height="${image.height}" loading="${eager ? 'eager' : 'lazy'}">
            <figcaption>${text(`${key}.caption`)}</figcaption>
        </figure>`;
        return `
<main class="container blocks-guide">
    <div class="breadcrumb"><a href="index.html">${text('homeLabel')}</a> / <a href="blog.html">${text('blogLabel')}</a> / <span>${text('shortTitle')}</span></div>
    <article class="article-container">
        <div class="article-header">
            <span class="tag">${text('categoryLabel')}</span>
            <h1>${text('title')}</h1>
            <p class="meta">${text('author')} · ${text('publishedLabel')}<time datetime="${escape(shared.datePublished.slice(0, 10))}">${escape(publishedDate)}</time> · ${text('readingTime')}</p>
        </div>
        ${figure({ src: shared.image, width: shared.imageWidth, height: shared.imageHeight }, 'hero', true)}
        <div class="content">
            <p class="intro">${text('intro')}</p>
            ${section('connect')}
            ${section('learning')}
            <ul>${entries('learning.ideas').map((_, index) => `<li>${text(`learning.ideas.${index}`)}</li>`).join('\n')}</ul>
            ${section('models')}
            <div class="model-gallery">${shared.models.map(image => figure(image, `models.images.${image.key}`)).join('\n')}</div>
            ${section('together')}
            ${figure(shared.familyImage, 'family')}
            ${section('storage')}
            ${section('choosing')}
            <section class="faq-section" aria-labelledby="faq-title">
                <h2 id="faq-title">${text('faq.title')}</h2>
                ${entries('faq.items').map((_, index) => `<div class="faq-item"><h3>${text(`faq.items.${index}.question`)}</h3><p>${text(`faq.items.${index}.answer`)}</p></div>`).join('\n')}
            </section>
            <aside class="link-box" aria-labelledby="cta-title">
                <h2 id="cta-title">${text('cta.title')}</h2>
                <p>${text('cta.body')}</p>
                <a class="btn btn-primary" href="${escape(shared.productsUrl)}">${text('cta.productsLabel')}</a>
                <a class="text-link" href="${escape(shared.contactUrl)}">${text('cta.contactLabel')}</a>
                <a class="text-link" href="${escape(shared.procurementUrl)}">${text('cta.procurementLabel')}</a>
            </aside>
        </div>
    </article>
</main>`;
    }
}

module.exports = BuildingBlocksPremiumBuilder;
if (require.main === module) new BuildingBlocksPremiumBuilder().build();
