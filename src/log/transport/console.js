/*
 *
 *  REQUIREMENTS
 *
 */
const LogTransport = require('../../structure/log_transport.js');
const {LOG_LEVEL} = require('../../constant/index.js');
const {DateTime} = require('luxon');

class ConsoleLogTransport extends LogTransport {
    log(entry) {
        if (!super.log(entry)) {
            return;
        }

        entry.timestamp = DateTime.fromJSDate(entry.timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);

        const {
            timestamp,
            level: {name: level},
            components = [],
            message_formatted: message,
            extra,
            error,
            stack_trace
        } = entry;

        let to_log = [
            `[${timestamp}]`,
            `[${level}]`,
            (components.length ? `[${components.join(' / ')}]` : undefined),
            ':',
            message,
            extra ? JSON.stringify(extra, null, 0) : extra
        ]
            .filter(element => !!element)
            .join(' ');

        if (error) {
            return console.error([to_log, ...stack_trace.map(line => `\t${line}`)].join('\n'));
        } else if (entry.level.value <= LOG_LEVEL.ERROR) {
            return console.error(to_log);
        } else if (entry.level.value === LOG_LEVEL.INFO) {
            return console.info(to_log);
        }

        return console.log(to_log);

    }
}

module.exports = ConsoleLogTransport;