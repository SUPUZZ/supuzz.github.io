const ArticleBuilder = require('./ArticleBuilder');

class KidsChairBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'kids-chair' });
    }
}

module.exports = KidsChairBuilder;
if (require.main === module) new KidsChairBuilder().build();
