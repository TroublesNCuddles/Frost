const BaseLoggableClass = require('./base_loggable.js');
const {
    Object: {mergeDeep, fetchValueFromObject},
    String: {capitalize}
} = require('../util/index.js');

class FrostManager extends BaseLoggableClass {
    constructor(name, options, frost, logger, plugin) {
        super(
            mergeDeep({
                    logger: {
                        components: ['Manager', capitalize(name)]
                    }
                },
                options
            ),
            frost,
            logger
        );

        this.name = capitalize(name);
        this.plugin = plugin;
        this.running = false;
    }

    run() {
        this.running = true;
    }

    isRunning() {
        return this.running;
    }

    getName() {
        return this.name;
    }

    getPlugin() {
        return this.plugin;
    }
}

module.exports = FrostManager;