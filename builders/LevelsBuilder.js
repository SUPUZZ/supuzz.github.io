const ArticleBuilder = require('./ArticleBuilder');

class LevelsBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'levels' });
    }
}

module.exports = LevelsBuilder;
if (require.main === module) new LevelsBuilder().build();
