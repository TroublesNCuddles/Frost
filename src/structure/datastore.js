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
        this.models = {};
    }

    getModelName(model) {
        return model.name.slice(0, -("Model".length));
    }

    registerModels(models) {
        return models.map(model => this.registerModel(model));
    }

    registerModel(model) {
        const name = this.getModelName(model);

        for (const property of Object.getOwnPropertyNames(model)) {
            if (typeof model[property] !== 'function') {
                continue;
            }

            model[property] = model[property].bind(model, this);
        }

        this.getLogger().info('Registered model ' + name);
        this.models[name] = model;

        return model;
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

    getModels() {
        return this.models;
    }

    getModel(model) {
        return this.models[model];
    }

}

module.exports = Datastore;