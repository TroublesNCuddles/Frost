const BaseLoggableClass = require('./base_loggable.js');
const {String: {capitalize}} = require('../util/index.js')

class FrostPlugin extends BaseLoggableClass {
    constructor(definition, options, frost, logger) {
        super(options, frost, logger);

        this.definition = definition;
        this.children = {};
        this.parent = null;
        this.running = false;
    }

    run() {
        this.running = true;
    }

    getDefinition() {
        return this.definition;
    }

    setParent(parent) {
        this.parent = parent;
    }

    getParent() {
        return this.parent;
    }

    hasParent() {
        return !!this.getParent();
    }

    getChildren() {
        return this.children;
    }

    hasChildren() {
        return Object.keys(this.getChildren()).length > 0;
    }

    addChild(plugin) {
        this.children[plugin.getDefinition().name] = plugin;
    }

    getChild(name) {
        return this.getChildren()[name];
    }

    isRunning() {
        return this.running;
    }
}

module.exports = FrostPlugin;