/*
 *
 *  REQUIREMENTS
 *
 */
const {BaseClassLoggable} = require('./structure/index.js');

class Frost extends BaseClassLoggable {
    constructor(options, logger) {
        super(options, null, logger);
    }

    async run() {
        this.getLogger().info('Running...');
    }
}

module.exports = Frost;