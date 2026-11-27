const path = require('node:path');

// Owns the Puzzle Online layout. Game content (picture collections) is read at
// runtime from the SUPUZZ admin API; everything else is localized here.
class PuzzleBuilder {
  constructor({ rootDir = path.resolve(__dirname, '..') } = {}) {
    this.rootDir = rootDir;
  }

  build() {
    return require('../scripts/build-pages').run(this.rootDir, ['puzzle']);
  }

  render({ text, shared, content, escape, locale }) {
    const cardKeys = ['snow', 'coral', 'dino', 'rainbow'];
    const steps = content.howTo.steps.map((_, index) => ({
      title: text(`howTo.steps.${index}.title`),
      body: text(`howTo.steps.${index}.body`)
    }));
    const faq = content.faq.items.map((_, index) => ({
      q: text(`faq.items.${index}.q`),
      a: text(`faq.items.${index}.a`)
    }));
    const cards = cardKeys.map(key => ({
      key,
      title: text(`collections.cards.${key}.title`),
      body: text(`collections.cards.${key}.body`),
      alt: text(`collections.cards.${key}.alt`),
      linkLabel: text(`collections.cards.${key}.link`),
      href: escape(shared.productLinks[key]),
      image: escape(shared.cardImages[key])
    }));
    const badges = content.badges.map((_, index) => text(`badges.${index}`));
    const paragraphs = content.why.paragraphs.map((_, index) => text(`why.paragraphs.${index}`));
    const difficulties = [3, 4, 5, 6, 7];
    const messages = JSON.stringify({
      setup: content.setup,
      game: content.game
    }).replaceAll('<', '\\u003c');

    return `
<main class="puzzle-page">
    <section class="pz-hero">
        <div class="container pz-hero-grid">
            <div class="pz-hero-copy">
                <p class="pz-eyebrow">${text('eyebrow')}</p>
                <h1>${text('title')}</h1>
                <p class="pz-lede">${text('intro')}</p>
                <ul class="pz-badges">
                    ${badges.map(badge => `<li>${badge}</li>`).join('\n                    ')}
                </ul>
                <div class="pz-hero-actions">
                    <a class="pz-btn pz-btn-primary" href="#play">
                        ${text('playLabel')}
                        <span class="material-symbols-rounded" aria-hidden="true">south</span>
                    </a>
                    <a class="pz-btn pz-btn-ghost" href="#how-to">${text('howToLabel')}</a>
                </div>
            </div>
            <div class="pz-hero-art" aria-hidden="true">
                ${shared.heroImages.map((src, index) => `<figure class="pz-art pz-art-${index + 1}"><img src="${escape(src)}" alt="" loading="${index === 0 ? 'eager' : 'lazy'}"></figure>`).join('\n                ')}
            </div>
        </div>
    </section>

    <section class="pz-play" id="play">
        <div class="container">
            <div class="pz-app" id="puzzleApp" data-api-base="${escape(shared.apiBase)}" data-lang="${escape(locale.directory)}">
                <div class="pz-setup" id="pzSetup">
                    <div class="pz-setup-head">
                        <div>
                            <h2>${text('setup.heading')}</h2>
                            <p>${text('setup.subheading')}</p>
                        </div>
                        <span class="pz-source" id="pzSource" hidden></span>
                    </div>
                    <div class="pz-collections" id="pzCollections" aria-live="polite">
                        <p class="pz-loading">${text('setup.loading')}</p>
                    </div>
                    <div class="pz-setup-foot">
                        <div class="pz-difficulty">
                            <span class="pz-field-label" id="pzDiffLabel">${text('setup.difficultyLabel')}</span>
                            <div class="pz-diff-options" role="group" aria-labelledby="pzDiffLabel">
                                ${difficulties.map(size => `<button type="button" class="pz-diff" data-size="${size}" aria-pressed="${size === 4}" aria-label="${text('setup.pieces').replace('{n}', size * size)}"><b>${size}×${size}</b><span>${size * size}</span></button>`).join('\n                                ')}
                            </div>
                        </div>
                        <div class="pz-start-row">
                            <button type="button" class="pz-photo" id="pzUploadBtn">
                                <span class="material-symbols-rounded" aria-hidden="true">add_photo_alternate</span>
                                ${text('setup.uploadLabel')}
                            </button>
                            <input type="file" id="pzUpload" accept="image/*" hidden>
                            <button type="button" class="pz-btn pz-btn-primary pz-start" id="pzStart" disabled>
                                ${text('setup.start')}
                                <span class="material-symbols-rounded" aria-hidden="true">play_arrow</span>
                            </button>
                            <button type="button" class="pz-btn pz-btn-ghost pz-start-full" id="pzStartFull" disabled>
                                <span class="material-symbols-rounded" aria-hidden="true">fullscreen</span>
                                ${text('setup.fullscreen')}
                            </button>
                        </div>
                        <p class="pz-upload-note">${text('setup.uploadNote')}</p>
                        <p class="pz-error" id="pzError" role="alert" hidden></p>
                    </div>
                </div>

                <div class="pz-stage" id="pzStage" hidden>
                    <div class="pz-hud" id="pzHud">
                        <span class="pz-hud-title"><span aria-hidden="true">🧩</span> ${text('game.hudTitle')}</span>
                        <div class="pz-stats">
                            <span>${text('game.time')} <b id="pzTime">00:00</b></span>
                            <span>${text('game.moves')} <b id="pzMoves">0</b></span>
                            <span>${text('game.groups')} <b id="pzGroups">-</b></span>
                        </div>
                        <button type="button" class="pz-hud-toggle" id="pzHudToggle" aria-expanded="true" aria-controls="pzHudActions" aria-label="${text('game.controls')}">
                            <svg class="pz-hud-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                                <path d="M6 9.5 12 15.5 18 9.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                        <div class="pz-hud-actions" id="pzHudActions">
                            <button type="button" id="pzHint">${text('game.hint')}</button>
                            <button type="button" id="pzShuffle">${text('game.shuffle')}</button>
                            <button type="button" id="pzFull" aria-pressed="false">${text('game.fullscreen')}</button>
                            <button type="button" id="pzBack">${text('game.back')}</button>
                        </div>
                    </div>
                    <div class="pz-workspace" id="pzWorkspace">
                        <div class="pz-layer" id="pzLayer">
                            <div class="pz-target" id="pzTarget"><canvas></canvas></div>
                            <div class="pz-cutstage" id="pzCutStage"><canvas id="pzCutPic"></canvas><canvas id="pzCutGrid"></canvas></div>
                        </div>
                        <div class="pz-tip" id="pzTip" role="status" aria-live="polite"></div>
                        <button type="button" class="pz-skip" id="pzSkip">${text('game.skip')}</button>
                        <button type="button" class="pz-fab" id="pzGather" aria-label="${text('game.pile')}">
                            <span class="pz-fab-label">${text('game.pile')}</span>
                        </button>
                        <div class="pz-ref" id="pzRefWrap"><img id="pzRef" alt=""></div>
                        <div class="pz-win" id="pzWin" role="dialog" aria-modal="true" aria-labelledby="pzWinTitle">
                            <div class="pz-win-card">
                                <button type="button" class="pz-win-close" id="pzWinClose" aria-label="${text('game.viewResult')}">
                                    <span class="pz-win-close-x" aria-hidden="true">&times;</span>
                                </button>
                                <p class="pz-win-emoji" aria-hidden="true">🎉</p>
                                <h2 id="pzWinTitle">${text('game.winTitle')}</h2>
                                <p id="pzWinDetail"></p>
                                <div class="pz-win-actions">
                                    <button type="button" class="pz-btn pz-btn-primary" id="pzView">${text('game.viewResult')}</button>
                                    <button type="button" class="pz-btn pz-btn-ghost" id="pzAgain">${text('game.again')}</button>
                                    <button type="button" class="pz-btn pz-btn-ghost" id="pzAnother">${text('game.another')}</button>
                                </div>
                            </div>
                        </div>
                        <div class="pz-done" id="pzDone" hidden>
                            <span class="pz-done-text" id="pzDoneText"></span>
                            <button type="button" class="pz-done-btn" id="pzDoneAgain">${text('game.again')}</button>
                            <button type="button" class="pz-done-btn is-ghost" id="pzDoneAnother">${text('game.another')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="pz-section pz-how" id="how-to">
        <div class="container">
            <div class="pz-section-head">
                <h2>${text('howTo.heading')}</h2>
                <p>${text('howTo.intro')}</p>
            </div>
            <ol class="pz-steps">
                ${steps.map((step, index) => `<li>
                    <span class="pz-step-num" aria-hidden="true">${index + 1}</span>
                    <div>
                        <h3>${step.title}</h3>
                        <p>${step.body}</p>
                    </div>
                </li>`).join('\n                ')}
            </ol>
        </div>
    </section>

    <section class="pz-section pz-editorial">
        <div class="container">
            <div class="pz-section-head">
                <h2>${text('collections.heading')}</h2>
                <p>${text('collections.intro')}</p>
            </div>
            <div class="pz-cards">
                ${cards.map(card => `<article class="pz-card" data-theme="${card.key}">
                    <div class="pz-card-media"><img src="${card.image}" alt="${card.alt}" loading="lazy" decoding="async"></div>
                    <div class="pz-card-body">
                        <h3>${card.title}</h3>
                        <p>${card.body}</p>
                        <a href="${card.href}">${card.linkLabel}<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a>
                    </div>
                </article>`).join('\n                ')}
            </div>
        </div>
    </section>

    <section class="pz-section pz-why">
        <div class="container pz-why-grid">
            <div class="pz-why-copy">
                <h2>${text('why.heading')}</h2>
                ${paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('\n                ')}
            </div>
            <div class="pz-why-aside">
                <p class="pz-aside-label">3×3 → 7×7</p>
                <p class="pz-aside-big">${text('why.cardTitle')}</p>
                <p class="pz-aside-note">${text('why.cardNote')}</p>
                <a class="pz-text-link" href="#play">${text('playLabel')}<span class="material-symbols-rounded" aria-hidden="true">arrow_upward</span></a>
            </div>
        </div>
    </section>

    <section class="pz-section pz-faq">
        <div class="container">
            <h2>${text('faq.heading')}</h2>
            <div class="pz-faq-list">
                ${faq.map(item => `<div class="pz-faq-item">
                    <h3>${item.q}</h3>
                    <p>${item.a}</p>
                </div>`).join('\n                ')}
            </div>
        </div>
    </section>

    <section class="pz-cta">
        <div class="container pz-cta-inner">
            <div>
                <h2>${text('cta.heading')}</h2>
                <p>${text('cta.body')}</p>
            </div>
            <div class="pz-cta-actions">
                <a class="pz-btn pz-btn-dark" href="${escape(shared.amazonStoreUrl)}" target="_blank" rel="noopener">${text('cta.shop')}</a>
                <a class="pz-btn pz-btn-outline" href="${escape(shared.gardenUrl)}" target="_blank" rel="noopener">${text('cta.garden')}</a>
                <p class="pz-cta-note">${text('cta.gardenNote')}</p>
            </div>
        </div>
    </section>
</main>
<script type="application/json" id="pzMessages">${messages}</script>
`;
  }

  structuredData({ content, url, locale }) {
    const faq = content.faq.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }));
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: content.homeLabel, item: `https://supuzz.com/${locale.directory}/index.html` },
          { '@type': 'ListItem', position: 2, name: content.title, item: url }
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq
      },
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: content.title,
        description: content.description,
        url,
        inLanguage: locale.htmlLang,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any (web browser)',
        gamePlatform: 'Web browser',
        genre: 'Puzzle',
        playMode: 'SinglePlayer',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        publisher: { '@type': 'Organization', name: 'SUPUZZ', url: 'https://supuzz.com/' }
      }
    ];
  }
}

module.exports = PuzzleBuilder;

if (require.main === module) new PuzzleBuilder().build();
