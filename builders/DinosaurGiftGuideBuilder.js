const path = require('node:path');

// Dedicated layout for the dinosaur gift guide, migrated from the legacy
// per-locale pages. Shared facts live in page.json; every sentence comes from
// the locale JSON files.
class DinosaurGiftGuideBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['dinosaur-gift-guide']);
    }

    render({ shared, content, locale, text, escape }) {
        if (!shared.amazon || typeof shared.amazon.href !== 'string' || !/^https:\/\/www\.amazon\.com\//.test(shared.amazon.href)) {
            throw new Error('Invalid Amazon link for dinosaur gift guide');
        }
        const items = (key, value) => {
            if (!Array.isArray(value) || !value.length) throw new Error(`Missing article content: ${key}`);
            return value;
        };
        const paragraphs = (key, value) => items(key, value).map(paragraph => `<p>${escape(paragraph)}</p>`).join('\n');
        const gallery = Array.isArray(content.gallery) && content.gallery.length
            ? (() => {
                if (!Array.isArray(shared.gallery) || content.gallery.length !== shared.gallery.length) {
                    throw new Error(`Gallery content does not match shared images: ${locale.directory}`);
                }
                return `<div class="inline-gallery">${shared.gallery.map((image, index) => {
                    const item = content.gallery[index];
                    if (!item || typeof item.alt !== 'string' || !item.alt.trim()) {
                        throw new Error(`Missing gallery alt: ${locale.directory}/${index}`);
                    }
                    const caption = item.caption ? `<figcaption>${escape(item.caption)}</figcaption>` : '';
                    return `<figure><img src="${escape(image.src)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${escape(item.alt)}">${caption}</figure>`;
                }).join('\n')}</div>`;
            })()
            : '';
        const checklist = content.checklist;
        if (!checklist || typeof checklist.title !== 'string') throw new Error(`Missing checklist: ${locale.directory}`);
        const checklistItems = items('checklist.items', checklist.items).map(item => {
            if (typeof item.label !== 'string' || typeof item.text !== 'string') {
                throw new Error(`Invalid checklist item: ${locale.directory}`);
            }
            return `<li><strong>${escape(item.label)}</strong> ${escape(item.text)}</li>`;
        }).join('\n');
        const faqItems = items('faq.items', content.faq && content.faq.items).map(item => {
            if (typeof item.question !== 'string' || typeof item.answer !== 'string') {
                throw new Error(`Invalid FAQ item: ${locale.directory}`);
            }
            return `<h3>${escape(item.question)}</h3><p>${escape(item.answer)}</p>`;
        }).join('\n');
        const date = new Intl.DateTimeFormat(locale.htmlLang, {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        }).format(new Date(shared.datePublished));
        return `
<main class="container dino-gift-guide">
    <div class="breadcrumb"><a href="index.html">${text('homeLabel')}</a><span aria-hidden="true">›</span><a href="blog.html">${text('blogLabel')}</a><span aria-hidden="true">›</span><span>${text('breadcrumbLabel')}</span></div>
    <article class="article-container">
        <div class="article-header"><span class="tag">${text('categoryLabel')}</span><h1>${text('title')}</h1><p class="meta"><time datetime="${escape(shared.datePublished.slice(0, 10))}">${escape(date)}</time> · ${text('author')} · ${text('readTime')}</p></div>
        <img src="${escape(shared.image)}" class="featured-img" width="${shared.imageWidth}" height="${shared.imageHeight}" loading="eager" fetchpriority="high" alt="${text('imageAlt')}">
        <div class="content">
            ${paragraphs('intro', content.intro)}
            <div class="gift-checklist"><h2>${text('checklist.title')}</h2><ol>
${checklistItems}
            </ol></div>
            <h2>${text('world.title')}</h2>
            ${paragraphs('world.paragraphs', content.world && content.world.paragraphs)}
            ${gallery}
            <h2>${text('replay.title')}</h2>
            ${paragraphs('replay.paragraphs', content.replay && content.replay.paragraphs)}
            <div class="amazon-card"><h2>${text('amazon.title')}</h2><p>${text('amazon.description')}</p><a class="amazon-button" href="${escape(shared.amazon.href)}" target="_blank" rel="noopener noreferrer sponsored">${text('amazon.button')}</a></div>
            <section class="faq-section"><h2>${text('faq.title')}</h2>
${faqItems}
            </section>
            <p class="disclosure">${text('disclosure')}</p>
        </div>
    </article>
</main>`;
    }

    structuredData({ content }) {
        if (!content.faq || !Array.isArray(content.faq.items) || !content.faq.items.length) return [];
        return [{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: content.faq.items.map(item => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer }
            }))
        }];
    }
}

module.exports = DinosaurGiftGuideBuilder;

if (require.main === module) new DinosaurGiftGuideBuilder().build();
