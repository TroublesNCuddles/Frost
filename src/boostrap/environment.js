/**
 *
 * REQUIREMENTS
 *
 */
const Package = require('../../package.json');
const {Object: {mergeDeep, fillObject}} = require('../util/index.js');

/**
 *
 * CONSTANTS
 *
 */

const STANDARD_PREFIX = Package._name.toUpperCase();
const SEPARATOR = "__";

/**
 *
 * FUNCTIONS
 *
 */

/**
 *
 * This function takes your object of variables (Usually provided by process.env) and filters out any entries
 * that doesn't start with the defined prefixes and separator joined, and then finishes off by removing the prefix + separator
 *
 * @param variables your object of variables to filter, usually from process.env
 * @param prefixes the prefixes you want to use to filter out variables, defaults to the name of the npm package
 * @returns {{}} all variables starting with the supplied prefix
 */
const filterAndCleanVariables = (variables = {}, prefixes = []) => {
    prefixes.unshift(STANDARD_PREFIX);
    prefixes = prefixes
        .filter(prefix => typeof prefix === 'string')
        .map(prefix => [prefix, SEPARATOR].join('').toLowerCase());

    const environment_variables = Object.entries(variables);
    const getMatchingPrefix = key => {
        const results = prefixes.filter(prefix => key.toLowerCase().startsWith(prefix));

        if (results.length > 0) {
            return results.shift();
        }

        return null;
    }

    return Object.fromEntries(
        environment_variables
            .filter(([key]) => {
                return getMatchingPrefix(key) !== null;
            })
            .map(([key, value]) => {
                const prefix = getMatchingPrefix(key);

                return [key.slice(prefix.length), value];
            })
    );
};

/**
 *
 * This splits the variable key using the supplied separator
 *
 * @param key the environment variable key
 * @param separator the separator to use to split the key, defaults to SEPARATOR
 * @returns {[string]}
 */
const splitVariable = (key, separator = SEPARATOR) => key.split(separator);

/**
 *
 * This will build an options object from the provided set of variables.
 * The variables should ideally be filtered and cleaned prior to running this.
 *
 * @param variables
 * @param separator the separator to use to split the key, defaults to SEPARATOR
 * @returns {{}}
 */
const buildOptions = (variables = {}, separator = SEPARATOR) => {
    return Object.entries(variables).reduce((accumulator, [key, value]) => {
        if (!key.includes(separator)) {
            accumulator[key] = value;

            return accumulator;
        }

        const key_pieces = splitVariable(key, separator);

        accumulator = mergeDeep(accumulator, fillObject(key_pieces, value));

        return accumulator;
    }, {});
};

const build = (variables = {}, prefixes, separator = SEPARATOR) => {
    variables = filterAndCleanVariables(variables, prefixes);

    return buildOptions(variables, separator);
};

module.exports = {
    filterAndCleanVariables,
    splitVariable,
    buildOptions,
    build,
    CONSTANT: {
        STANDARD_PREFIX,
        SEPARATOR
    }
};