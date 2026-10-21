const ArticleBuilder = require('./ArticleBuilder');

class WaffleBlocksStemToddlerBuilder extends ArticleBuilder {
    constructor(options = {}) {
        super({ ...options, pageId: 'waffle-blocks-stem-toddler' });
    }
}

module.exports = WaffleBlocksStemToddlerBuilder;
if (require.main === module) new WaffleBlocksStemToddlerBuilder().build();
