/*
 *
 *  REQUIREMENTS
 *
 */
const {formatWithOptions} = require('util');

const formatMessage = (options, ...replacements) => {
    let message = replacements.length > 0 ? replacements.unshift() : '';

    if (typeof options === 'string') {
        message = options;
        options = {};
    }

    return formatWithOptions(options, message, ...replacements);
}

const capitalize = (str) => {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};

module.exports = {capitalize, formatMessage};