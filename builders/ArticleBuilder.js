const path = require('node:path');

// Article-specific Builders share layout; facts and translated copy stay in page resources.
class ArticleBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..'), pageId } = {}) {
        this.rootDir = rootDir;
        this.pageId = pageId;
    }

    build() {
        if (!this.pageId) throw new Error('Specify an article page ID');
        return require('../scripts/build-pages').run(this.rootDir, [this.pageId]);
    }

    render({ shared, content, locale, text, escape }) {
        const entries = key => {
            const values = key.split('.').reduce((value, part) => value?.[part], content);
            if (!Array.isArray(values) || !values.length) throw new Error(`Missing article content: ${key}`);
            return values;
        };
        const image = (asset, key, hero = false) => {
            if (!asset || typeof asset.src !== 'string' || !/^\/(?!\/)/.test(asset.src)
                || !Number.isInteger(asset.width) || asset.width <= 0
                || !Number.isInteger(asset.height) || asset.height <= 0) throw new Error(`Invalid article image: ${key}`);
            return `<figure><img class="${hero ? 'featured-img' : 'detail-img'}" src="${escape(asset.src)}" width="${asset.width}" height="${asset.height}" alt="${text(hero ? 'imageAlt' : `${key}.alt`)}" loading="${hero ? 'eager' : 'lazy'}" decoding="async"${hero ? ' fetchpriority="high"' : ''}><figcaption>${text(`${key}.caption`)}</figcaption></figure>`;
        };
        const links = (values, key) => {
            if (!Array.isArray(values) || !values.length) throw new Error(`Missing article links: ${key}`);
            return `<ul class="article-links">${values.map(({ key: name, href }) => {
                if (typeof href !== 'string' || !/^[a-z0-9][a-z0-9-]*\.html(?:[?#][a-z0-9_?=&#%-]*)?$/.test(href)) throw new Error(`Invalid article link: ${key}.${name}`);
                return `<li><a href="${escape(href)}">${text(`${key}.${name}`)}</a></li>`;
            }).join('\n')}</ul>`;
        };
        if (!Array.isArray(shared.sections) || !shared.sections.length) throw new Error('Missing article sections');
        const keys = shared.sections.map(({ key }) => key);
        if (keys.some(key => !/^[a-z][A-Za-z0-9]*$/.test(key)) || new Set(keys).size !== keys.length) throw new Error('Invalid article section keys');
        const sections = shared.sections.map(section => {
            const key = `sections.${section.key}`;
            const list = section.list ? `<${section.ordered ? 'ol' : 'ul'}>${entries(`${key}.items`).map((_, index) => `<li>${text(`${key}.items.${index}`)}</li>`).join('\n')}</${section.ordered ? 'ol' : 'ul'}>` : '';
            return `<section aria-labelledby="section-${section.key}">
                <h2 id="section-${section.key}">${text(`${key}.title`)}</h2>
                ${entries(`${key}.paragraphs`).map((_, index) => `<p>${text(`${key}.paragraphs.${index}`)}</p>`).join('\n')}
                ${list}
                ${section.image ? image(section.image, `${key}.image`) : ''}
                ${section.links ? links(section.links, `${key}.links`) : ''}
            </section>`;
        }).join('\n');
        const date = new Intl.DateTimeFormat(locale.htmlLang, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(shared.datePublished));
        return `
<main class="container article-guide">
    <div class="breadcrumb"><a href="index.html">${text('homeLabel')}</a> / <a href="blog.html">${text('blogLabel')}</a> / <span aria-current="page">${text('shortTitle')}</span></div>
    <article class="article-container">
        <div class="article-header">
            <span class="tag">${text('categoryLabel')}</span>
            <h1>${text('title')}</h1>
            <p class="meta">${text('author')} · ${text('publishedLabel')}<time datetime="${escape(shared.datePublished.slice(0, 10))}">${escape(date)}</time></p>
        </div>
        ${image({ src: shared.image, width: shared.imageWidth, height: shared.imageHeight }, 'hero', true)}
        <div class="content">
            <p class="intro">${text('intro')}</p>
            ${sections}
            <section class="faq-section" aria-labelledby="faq-title">
                <h2 id="faq-title">${text('faq.title')}</h2>
                ${entries('faq.items').map((_, index) => `<div class="faq-item"><h3>${text(`faq.items.${index}.question`)}</h3><p>${text(`faq.items.${index}.answer`)}</p></div>`).join('\n')}
            </section>
            <aside class="link-box" aria-labelledby="related-title">
                <h2 id="related-title">${text('related.title')}</h2>
                ${links(shared.related, 'related.links')}
            </aside>
            <p class="back-link"><a href="blog.html">${text('backLabel')}</a></p>
        </div>
    </article>
</main>`;
    }
}

module.exports = ArticleBuilder;
