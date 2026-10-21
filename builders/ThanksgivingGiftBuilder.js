const ArticleBuilder = require('./ArticleBuilder');

class ThanksgivingGiftBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'thanksgiving-gift' });
    }
}

module.exports = ThanksgivingGiftBuilder;
if (require.main === module) new ThanksgivingGiftBuilder().build();
