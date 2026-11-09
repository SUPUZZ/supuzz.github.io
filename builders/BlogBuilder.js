const fs = require('node:fs');
const path = require('node:path');
const { publicationMetadata } = require('../scripts/article-publication');
const { halloweenCardCover } = require('../scripts/halloween-card-cover');

// Blog index page: one renderer for every locale. Card data comes from the
// migrated article resources when available and from resource/blog-legacy.json
// for the articles that have not been migrated yet.
class BlogBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['blog']);
    }

    migratedArticles() {
        const source = path.join(this.rootDir, 'resource', 'pages');
        const map = new Map();
        for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name === 'blog') continue;
            const definitionPath = path.join(source, entry.name, 'page.json');
            if (!fs.existsSync(definitionPath)) continue;
            const definition = JSON.parse(fs.readFileSync(definitionPath, 'utf8'));
            if (definition.type === 'article') map.set(definition.file, { id: entry.name, definition });
        }
        return map;
    }

    render({ locale, content, shared, text, escape }) {
        if (!Array.isArray(shared.posts) || !shared.posts.length) throw new Error('Missing blog posts');
        if (!Array.isArray(shared.filters) || !shared.filters.length) throw new Error('Missing blog filters');
        const migrated = this.migratedArticles();
        const legacy = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'resource', 'blog-legacy.json'), 'utf8'));

        const card = post => {
            if (!/^[\w-]+\.html$/.test(post.href)) throw new Error(`Invalid blog href: ${post.href}`);
            if (!shared.filters.includes(post.category)) throw new Error(`Unknown blog category: ${post.category}`);
            const articlePath = path.join(this.rootDir, locale.directory, post.href);
            if (!fs.existsSync(articlePath)) throw new Error(`Missing blog article: ${locale.directory}/${post.href}`);
            const meta = publicationMetadata(articlePath, locale.directory);
            const source = migrated.get(post.href);
            let title, excerpt, alt, image, width, height;
            if (source) {
                const copy = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'resource', 'pages', source.id, `${locale.directory}.json`), 'utf8'));
                title = copy.title;
                excerpt = copy.description;
                alt = copy.imageAlt;
                image = source.definition.shared.image;
                width = source.definition.shared.imageWidth;
                height = source.definition.shared.imageHeight;
            } else {
                const copy = legacy[post.href] && legacy[post.href][locale.directory];
                if (!copy) throw new Error(`Missing legacy blog card: ${locale.directory}/${post.href}`);
                ({ title, excerpt, alt, image, width, height } = copy);
            }
            if (post.category === 'halloween-gifts') {
                const cover = halloweenCardCover(locale.directory, post.href);
                ({ image, width, height, alt } = cover);
            }
            if (!Number.isInteger(Number(width)) || !Number.isInteger(Number(height))) {
                throw new Error(`Invalid blog cover size: ${post.href}`);
            }
            const categoryLabel = text(`filters.${post.category}`);
            return `<a class="blog-card" href="${escape(post.href)}" data-category="${escape(post.category)}" aria-label="${escape(title)}">
    <div class="blog-card-image"><img src="${escape(image)}" alt="${escape(alt)}" width="${Number(width)}" height="${Number(height)}" loading="lazy" decoding="async"></div>
    <div class="blog-card-body">
        <div class="blog-card-meta">
            <p class="blog-published"><span class="blog-card-calendar" aria-hidden="true"></span><span class="blog-card-sr-only">${escape(meta.label)}</span><time datetime="${escape(meta.date)}">${escape(meta.dateText)}</time></p>
            <span class="blog-card-category" title="${escape(categoryLabel)}">${escape(categoryLabel)}</span>
        </div>
        <h3 class="blog-card-title">${escape(title)}</h3>
        <p class="blog-card-excerpt">${escape(excerpt)}</p>
    </div>
</a>`;
        };

        const filters = shared.filters.map((key, index) =>
            `<button type="button" class="filter-btn${index === 0 ? ' active' : ''}" data-filter="${escape(key)}" aria-pressed="${index === 0}">${text(`filters.${key}`)}</button>`
        ).join('\n                    ');

        return `
<div class="blog-page">
    <div class="container">
        <section class="blog-page-header"><h1>${text('title')}</h1><p>${text('intro')}</p></section>
        <div class="blog-list-section">
            <h2 class="blog-list-title">${text('listTitle')}</h2>
            <div class="blog-filters" id="blogFilters">
                    ${filters}
            </div>
            <div class="blog-grid" id="blogGridContainer">
${shared.posts.map(card).join('\n')}
            </div>
        </div>
    </div>
</div>`;
    }

    structuredData({ content, url }) {
        return [
            {
                '@context': 'https://schema.org', '@type': 'Blog',
                name: content.title, url, description: content.description,
                publisher: {
                    '@type': 'Organization', name: 'SUPUZZ',
                    logo: { '@type': 'ImageObject', url: 'https://supuzz.com/images/android-chrome-512x512.png' }
                }
            },
            { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SUPUZZ', url }
        ];
    }
}

module.exports = BlogBuilder;

if (require.main === module) new BlogBuilder().build();
