/*
 *
 *  REQUIREMENTS
 *
 */
const {Object: {fetchValueFromObject, mergeDeep}} = require('../util/index.js')

class BaseClass {
    constructor(options = {}, frost = null) {
        if (Array.isArray(options)) {
            options = mergeDeep(...options);
        }

        this.options = options;
        this.frost = frost;
    }

    /**
     *
     * GETTERS & SETTERS
     *
     */

    getOption(key, def) {
        return fetchValueFromObject(key, def, this.getOptions());
    }

    getOptions() {
        return this.options;
    }

    getFrost() {
        return this.frost;
    }

}

/*
 *
 * EXPORTS
 *
 */
module.exports = BaseClass;