const ArticleBuilder = require('./ArticleBuilder');

class RainbowBlocksGiftChecklistBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'rainbow-blocks-gift-checklist' });
    }
}

module.exports = RainbowBlocksGiftChecklistBuilder;
if (require.main === module) new RainbowBlocksGiftChecklistBuilder().build();
