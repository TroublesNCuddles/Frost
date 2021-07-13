const BaseLoggableClass = require('./base_loggable.js');
const {String: {capitalize}} = require('../util/index.js')

class FrostPlugin extends BaseLoggableClass {
    constructor(definition, options, frost, logger) {
        super(options, frost, logger);

        this.definition = definition;
        this.children = {};
        this.parent = null;
        this.running = false;
        this.managers = {};
        this.commands = {};
    }

    async registerManagers(Managers) {
        for (const [key, Manager] of Object.entries(Managers)) {
            await this.registerManager(Manager, key.slice(0, -("Manager".length)), {});
        }
    }

    async registerManager(Manager, name, options) {
        await this.getFrost().registerManager(Manager, name, options, this);
        const manager = this.getFrost().getManager(name);
        this.managers[manager.getName()] = manager;
        this[`get${manager.getName()}Manager`] = this.getFrost().getManager.bind(this, manager.getName());
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

    getName() {
        return this.getDefinition().name;
    }

    getDescription() {
        return this.getDefinition().description;
    }

    getVersion() {
        return this.getDefinition().version;
    }

    getAuthor() {
        return this.getDefinition().author;
    }

    getCommands() {
        return this.commands;
    }

    hasCommands() {
        return Object.values(this.getCommands()).length > 0;
    }
}

module.exports = FrostPlugin;