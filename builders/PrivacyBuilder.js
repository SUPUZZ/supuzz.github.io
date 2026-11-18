const path = require('node:path');

class PrivacyBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['privacy']);
    }

    render({ text, content, shared, escape }) {
        if (!Array.isArray(content.sections) || !content.sections.length) throw new Error('Missing privacy sections');
        return `
<main class="privacy-page">
    <div class="privacy-header">
        <h1>${text('title')}</h1>
        <p class="privacy-updated">${text('updated')}</p>
    </div>
    ${content.sections.map((section, index) => {
        if (!Array.isArray(section.paragraphs) || !section.paragraphs.length) {
            throw new Error(`Missing privacy section paragraphs: ${index}`);
        }
        return `<section class="privacy-section">
        <h2>${text(`sections.${index}.heading`)}</h2>
        ${section.paragraphs.map((_, paragraph) => `<p>${text(`sections.${index}.paragraphs.${paragraph}`)}</p>`).join('\n')}
    </section>`;
    }).join('\n')}
    <p class="privacy-contact">${text('contactLine')} <a href="mailto:${escape(shared.email)}">${escape(shared.email)}</a></p>
</main>`;
    }
}

module.exports = PrivacyBuilder;

if (require.main === module) new PrivacyBuilder().build();
