const ArticleBuilder = require('./ArticleBuilder');

class IcyWorldBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'icy-world' });
    }
}

module.exports = IcyWorldBuilder;
if (require.main === module) new IcyWorldBuilder().build();
