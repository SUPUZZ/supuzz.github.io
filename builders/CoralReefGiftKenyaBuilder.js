const path = require('node:path');

// Customer-story layout for the coral reef gift sent to Kenya: hero split, fact cards,
// callout and explore CTA. One layout, per-locale copy in resource/pages/coral-reef-gift-kenya/.
class CoralReefGiftKenyaBuilder {
    constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
        this.rootDir = rootDir;
    }

    build() {
        return require('../scripts/build-pages').run(this.rootDir, ['coral-reef-gift-kenya']);
    }

    render({ shared, content, text, escape }) {
        if (!Array.isArray(shared.facts) || shared.facts.length !== 4) throw new Error('Missing gift story facts');
        if (typeof shared.amazonUrl !== 'string' || !/^https:\/\//.test(shared.amazonUrl)) throw new Error('Invalid Amazon URL');
        const paragraphs = key => {
            const values = key.split('.').reduce((value, part) => value?.[part], content);
            if (!Array.isArray(values) || !values.length) throw new Error(`Missing gift story paragraphs: ${key}`);
            return values.map((_, index) => `<p>${text(`${key}.${index}`)}</p>`).join('\n                ');
        };
        const facts = shared.facts.map(fact => `
                <div class="fact"><span class="material-symbols-rounded" aria-hidden="true">${escape(fact.icon)}</span><strong>${text(`facts.${fact.key}.label`)}</strong><small>${text(`facts.${fact.key}.text`)}</small></div>`).join('');
        const buy = `<a class="purchase-link" href="${escape(shared.amazonUrl)}" target="_blank" rel="noopener noreferrer sponsored">${text('shopCta')} <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a>`;
        return `
<style>
    :root { --ocean:#166B8B; --ink:#17232B; --muted:#52616A; --foam:#EEF8FA; --coral:#D85D47; --sun:#FFD84D; --line:#D7E5E8; }
    .gift-story * { box-sizing: border-box; }
    .gift-story { font-family: 'Outfit', sans-serif; color: var(--ink); line-height: 1.65; }
    .article-shell { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 104px 0 72px; }
    .breadcrumb { display: flex; flex-wrap: wrap; justify-content: flex-start; align-items: center; width: auto; gap: 8px; font-size: .93rem; color: var(--muted); margin-bottom: 24px; }
    .breadcrumb a { color: var(--ocean); text-decoration: none; }
    .breadcrumb span { color: #91A4AA; }
    .hero { display: grid; grid-template-columns: minmax(0, .92fr) minmax(360px, 1.08fr); align-items: center; gap: clamp(28px, 5vw, 64px); padding: clamp(28px, 5vw, 54px); background: var(--foam); border: 1px solid var(--line); border-radius: 8px; }
    .eyebrow { margin: 0 0 14px; color: var(--ocean); font-size: .9rem; font-weight: 700; letter-spacing: 0; text-transform: uppercase; }
    .gift-story h1 { font-size: clamp(2.35rem, 5vw, 4.35rem); line-height: 1.05; letter-spacing: 0; margin: 0 0 20px; }
    .hero p { color: var(--muted); font-size: 1.13rem; margin: 0 0 26px; }
    .hero-image { width: 100%; aspect-ratio: 1.38 / 1; object-fit: contain; background: #fff; border: 1px solid var(--line); border-radius: 6px; }
    .purchase-link { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; color: #141414; background: var(--sun); border: 1px solid #D4AF20; border-radius: 5px; font-weight: 700; text-decoration: none; }
    .purchase-link:hover { background: #F4C940; }
    .facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 30px 0 58px; }
    .fact { min-height: 118px; padding: 18px; background: #fff; border: 1px solid var(--line); border-radius: 6px; }
    .fact .material-symbols-rounded { color: var(--ocean); font-size: 27px; }
    .fact strong { display: block; margin-top: 8px; font-size: 1.04rem; }
    .fact small { display: block; color: var(--muted); line-height: 1.4; }
    .content { width: min(760px, 100%); margin: 0 auto; font-size: 1.08rem; }
    .content p { margin: 0 0 22px; color: #33424A; }
    .content h2 { margin: 52px 0 16px; font-size: clamp(1.65rem, 3vw, 2.25rem); line-height: 1.18; color: var(--ink); }
    .callout { margin: 38px 0; padding: 26px 28px; background: #FFF6DD; border-left: 4px solid var(--sun); }
    .callout h2 { margin-top: 0; font-size: 1.55rem; }
    .callout p:last-child { margin-bottom: 0; }
    .explore { margin-top: 54px; padding: 32px; color: #fff; background: var(--ocean); border-radius: 7px; }
    .explore h2 { margin: 0 0 10px; font-size: 1.85rem; }
    .explore p { color: #E3F4F8; margin: 0 0 22px; }
    .explore .purchase-link { background: #fff; border-color: #fff; color: var(--ocean); }
    .disclosure { margin-top: 20px; color: #728087; font-size: .84rem; }
    @media (max-width: 760px) { .article-shell { width: min(100% - 28px, 1120px); padding-top: 88px; } .hero { grid-template-columns: 1fr; padding: 24px; } .facts { grid-template-columns: repeat(2, 1fr); margin-bottom: 45px; } .fact { min-height: 108px; } .content { font-size: 1rem; } }
</style>
<main class="article-shell gift-story">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">${text('homeLabel')}</a><span>/</span><a href="blog.html">${text('blogLabel')}</a><span>/</span><span>${text('breadcrumbLabel')}</span></nav>
    <article>
        <section class="hero" aria-labelledby="article-title">
            <div>
                <p class="eyebrow">${text('eyebrow')}</p>
                <h1 id="article-title">${text('title')}</h1>
                <p>${text('heroIntro')}</p>
                ${buy}
            </div>
            <img class="hero-image" src="${escape(shared.image)}" alt="${text('imageAlt')}" width="${shared.imageWidth}" height="${shared.imageHeight}">
        </section>

        <section class="facts" aria-label="${text('factsLabel')}">${facts}
        </section>

        <div class="content">
            ${paragraphs('intro')}

            <h2>${text('reason.title')}</h2>
            ${paragraphs('reason.paragraphs')}

            <div class="callout">
                <h2>${text('callout.title')}</h2>
                <p>${text('callout.text')}</p>
            </div>

            <h2>${text('after.title')}</h2>
            ${paragraphs('after.paragraphs')}

            <section class="explore" aria-label="${text('explore.ariaLabel')}">
                <h2>${text('explore.title')}</h2>
                <p>${text('explore.text')}</p>
                <a class="purchase-link" href="${escape(shared.amazonUrl)}" target="_blank" rel="noopener noreferrer sponsored">${text('explore.cta')} <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a>
            </section>
            <p class="disclosure">${text('disclosure')}</p>
        </div>
    </article>
</main>`;
    }
}

module.exports = CoralReefGiftKenyaBuilder;

if (require.main === module) new CoralReefGiftKenyaBuilder().build();
