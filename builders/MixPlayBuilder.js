const ArticleBuilder = require('./ArticleBuilder');

class MixPlayBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'mix-play' });
    }
}

module.exports = MixPlayBuilder;
if (require.main === module) new MixPlayBuilder().build();
