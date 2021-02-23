/**
 *
 * REQUIREMENTS
 *
 */
const {String: {formatMessage}} = require('../util/index.js');
const {LOG_LEVEL, ERROR_CODE, DEFAULT: {LOGGER: DEFAULT_LOGGER_OPTIONS}} = require('../constant/index.js');
const FrostError = require('./error.js');
const {Object: {mergeDeep}} = require('../util/index.js');
const BaseClass = require('./base.js');

/**
 *
 * CLASS DEFINITION
 *
 */
class Logger extends BaseClass {
    constructor(options, frost) {
        super([DEFAULT_LOGGER_OPTIONS, options], frost);

        this.transports = [];
        this.components = Array.isArray(options.components) ? options.components : (options.components ? [options.components] : []).filter(el => !!el);
        const transports = Array.isArray(options.transports) ? options.transports : (options.transports ? [options.transports] : []).filter(el => !!el);

        transports.forEach(transport => this.addTransport(transport));

        if (options.parental_level && !options.parent) {
            options.parental_level = false;
        }


        this.parent = options.parent;
        this.setLevel(this.getOption('parental_level', false).toString() === 'true' ? this.getParent().getLevel() : this.getOption('level', null));
        this.applyLevelsAsFunctions();
    }

    createChildLogger(options = {}) {
        return new Logger(mergeDeep(options, {parent: this}));
    }

    addTransport(transport) {
        if (!transport) {
            return;
        }

        transport.setLogger(this);
        this.transports.push(transport);
    }

    log(options, ...args) {
        if (typeof options === 'string' || options instanceof Error) {
            args.unshift(options);
            options = {};
        }

        if (this.getParent()) {
            return this.getParent().log(mergeDeep({
                components: this.components,
                transports: this.transports,
                loggable_level: this.getOption('parental_level', false) ? null : this.getLevel()
            }, options), ...args);
        }

        if (args.length < 1 && (!options.message && !options.message_formatted)) {
            return;
        }

        let {level, components = [], transports = []} = options;

        if (level === undefined || level === null) {
            level = this.getLevel();
        }

        if (typeof level === 'string') {
            level = {name: level, value: this.getLevelFromString(level)};
        } else {
            level = {name: this.getLevelAsString(level), value: level};
        }

        options = mergeDeep(options, {
            components: [...this.getComponents(), ...components].filter(el => !!el),
            transports: [...this.getTransports(), ...transports].filter(el => !!el),
            timestamp: new Date(),
            level,
        });

        const input = args.shift();

        if (typeof input === 'string') {
            options = mergeDeep(options, {
                message: input,
                replacements: args
            });
        } else if (input instanceof Error) {
            options = mergeDeep(options, {
                message: `[%s%s]${input.message ? ' ' + input.message : ''}`,
                replacements: [input.name || 'Unknown', (input instanceof FrostError) ? '/' + input.getCode() : ''],
                error: true
            });

            let count = 0;
            const stack_trace = [];

            //Left over code to deal with FiveM's stupid stack traces. Will be reworked in the future
            //TODO: Remove FiveM's stack trace hack
            for (const part of Array.isArray(input.stack) ? input.stack : input.stack.split('\n')) {
                if (typeof part === 'string') {
                    if (part === `${input.name}: ${input.message}`) {
                        continue;
                    }

                    stack_trace.push(`[${++count}]: ${part.trim()}`);
                } else {
                    const {name, file, line} = part;
                    stack_trace.push(`[${++count}]: in ${name || 'Unknown'} at ${file}:${line}`);
                }
            }

            options.stack_trace = stack_trace;

            if (input instanceof FrostError) {
                options.data = input.data;
            }
        }

        options.message_formatted = formatMessage(options.message, ...(options.replacements || []))

        this.sendLogToTransports(options, options.transports);
    }

    sendLogToTransports(options, transports) {
        transports.forEach(transport => {
            const result = transport.log(options);

            if (result instanceof Promise) {
                result.catch(e => console.error(e));
            }
        });
    }

    applyLevelsAsFunctions() {
        for (const [name, level] of Object.entries(LOG_LEVEL)) {
            this[name.toLowerCase()] = (function (options = {}, ...args) {
                if (typeof options === 'string' || options instanceof Error) {
                    args.unshift(options);
                    options = {};
                }
                return this.log(mergeDeep(options, {level: level}), ...args);
            }).bind(this);
        }
    }

    getLevelFromString(level) {
        return Object.entries(LOG_LEVEL)
            .filter(([level_name]) => level_name.toUpperCase() === level.toUpperCase())
            .map(([_, level_value]) => level_value)
            .shift();
    }

    getLevelAsString(level) {
        const results = Object.entries(LOG_LEVEL)
            .filter(([name, value]) => level === value)
            .map(([name, value]) => name);

        if (results.length > 0) {
            return results[0];
        }

        return 'UNKNOWN';
    }

    isLoggableLevel(level, loggable_level) {
        return level <= loggable_level || this.getLevel();
    }

    getLevel() {
        return this.getParent() ? this.getParent().getLevel() : this.level;
    }

    setLevel(level) {
        if (!level) {
            level = LOG_LEVEL.DEBUG;
        }

        if (typeof level === 'string') {
            level = this.getLevelFromString(level);
        }

        if (Object.values(LOG_LEVEL).filter(el => el === level).length < 1) {
            throw new FrostError(`Invalid Log Level ${level}`, ERROR_CODE.LOG_INVALID_LEVEL, {level});
        }

        this.level = level;
    }

    getComponents() {
        return this.getParent() ? [...this.getParent().getComponents(), this.components] : this.components;
    }

    getTransports() {
        return this.getParent() ? [...this.getParent().getTransports(), this.transports] : this.transports;
    }

    getParent() {
        return this.parent;
    }

}

/**
 *
 * EXPORTS
 *
 */

module.exports = Logger;