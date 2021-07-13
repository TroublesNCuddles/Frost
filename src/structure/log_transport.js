/*
 *
 *  REQUIREMENTS
 *
 */
class LogTransport {
    constructor(options = {}) {
        if (options.level) {
            this.level = options.level;
        }
    }

    log(entry) {
        return this.isLoggableLevel(entry.level.value, entry.loggable_level);
    }

    setLogger(logger) {
        this.logger = logger;
    }

    getLogger() {
        return this.logger;
    }

    getLevel() {
        return this.level;
    }

    isLoggableLevel(level, loggable_level) {
        return this.getLevel() !== undefined ? level <= (loggable_level || this.getLevel()) : this.getLogger().isLoggableLevel(level, loggable_level);
    }
}

module.exports = LogTransport;