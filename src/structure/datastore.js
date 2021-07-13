/**
 *
 * REQUIREMENTS
 *
 */
const {
    Object: {mergeDeep},
    String: {capitalize}
} = require('../util/index.js');
const BaseLoggableClass = require('./base_loggable.js');


class Datastore extends BaseLoggableClass {
    constructor(name, frost, options, logger, plugin) {
        super(mergeDeep({
            logger: {
                components: ['Datastore', capitalize(name)]
            }
        }, options), frost, logger);

        this.plugin = plugin;
        this.connected = false;
        this.name = name;
    }

    async connect() {
        throw new Error('Not Implemented');
    }

    getName() {
        return this.name;
    }

    getFrost() {
        return this.frost;
    }

    getPlugin() {
        return this.plugin;
    }

    isConnected() {
        return this.connected;
    }

}

module.exports = Datastore;