/*
 *
 *  REQUIREMENTS
 *
 */
const {BaseClassLoggable, FrostError} = require('./structure/index.js');
const {ERROR_CODE} = require('./constant/index.js');

class Frost extends BaseClassLoggable {
    constructor(options, logger) {
        super(options, null, logger);
    }

    async run() {
        if (!this.getOption('discord=>token', null)) {
            throw new FrostError('Missing Discord Token', ERROR_CODE.MISSING_DISCORD_TOKEN);
        }

        this.getLogger().info('Running...');
    }
}

module.exports = Frost;