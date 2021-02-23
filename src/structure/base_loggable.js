/*
 *
 *  REQUIREMENTS
 *
 */
const BaseClass = require('./base.js');
const Logger = require('./logger.js')
const {Transports: {Console: ConsoleLogTransport}} = require('../log/index.js');
const {Object: {mergeDeep}} = require('../util/index.js');

class BaseLoggableClass extends BaseClass {
    constructor(options, frost, logger) {
        super(options, frost);

        this.setupLogger(logger);
    }

    setupLogger(logger) {
        const options = this.getOption('logger', {});
        let components = options.components;

        if (typeof components === 'string') {
            components = components.split(';');
        } else if (!Array.isArray(components)) {
            components = [];
        }

        options.components = components.filter(component => typeof component === 'string');

        if (this.getFrost() || logger) {
            this.logger = (logger || this.getFrost().getLogger()).createChildLogger(options);
        } else {
            this.logger = new Logger(
                mergeDeep(options, {
                    transports: [new ConsoleLogTransport()]
                })
            );
        }
    }

    getLogger() {
        return this.logger;
    }
}

module.exports = BaseLoggableClass;