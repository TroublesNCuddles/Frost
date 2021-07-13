const LOG_LEVEL = require('../log_level.js');

module.exports = {
    logger: {
        components: ['Frost'],
        pass_on_to_parents: true,
        level: LOG_LEVEL.INFO
    }
};