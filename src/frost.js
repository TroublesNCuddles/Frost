/*
 *
 *  REQUIREMENTS
 *
 */
const {BaseLoggableClass, FrostError} = require('./structure/index.js');
const {
    Object: {mergeDeep}
} = require('./util/index.js');
const {ERROR_CODE} = require('./constant/index.js');
const Managers = require('./manager/index.js');
const Datastores = require('./datastore/index.js');

class Frost extends BaseLoggableClass {
    constructor(options, logger) {
        super(options, null, logger);

        this.managers = {};
        this.datastores = {};
    }

    async run() {
        this.getLogger().info('Starting...');
        this.registerDefaultDatastores();
        this.registerDefaultManagers();
        this.getLogger().info('Running.');
    }

    registerDefaultManagers() {
        this.getLogger().fine('Registering default managers');
        for (const [key, Manager] of Object.entries(Managers)) {
            this.registerManager(Manager, key.slice(0, -("Manager".length)), {}).catch(e => {
                this.getLogger().error('Failed to register and launch manager: ' + key.slice(0, -("Manager".length)) + '. \n%s' + e.stack);
            });
        }
    }

    registerDefaultDatastores() {
        this.getLogger().fine('Registering default datastores');
        for (const [key, {Datastore, Definition}] of Object.entries(Datastores)) {
            this.registerDatastore(Datastore, Definition.name, Definition.default_options || {}).catch(e => {
                this.getLogger().error('Failed to register and launch datastore: ' + Definition.name + '. \n%s' + e.stack);
            });
        }
    }

    async registerDatastore(Datastore, name, options, plugin) {
        this.getLogger().fine('Registering %s Datastore.%s', name, plugin !== undefined ? `On behalf of Plugin: ${plugin.getName()}` : '');
        options = mergeDeep(plugin ? plugin.getOption(`datastore=>${name}`, {}) : this.getOption(`datastore=>${name}`, {}), options);

        const datastore = new Datastore(name, this, options, undefined, plugin);
        const func_name = `get${datastore.getName()}Datastore`;

        this.datastores[datastore.getName()] = datastore;
        this[func_name] = this.getDatastore.bind(this, datastore.getName());

        this.getLogger().fine('Registered datastore %s under function %s', datastore.getName(), func_name);

        return this.runDatastore(datastore.getName());
    }

    async runDatastore(datastore_name) {
        const datastore = this.getDatastore(datastore_name);

        if (!datastore) {
            throw new FrostError(`No such datastore ${datastore_name}`, ERROR_CODE.INVALID_DATASTORE);
        }

        try {
            datastore.getLogger().fine('Starting...');
            const result = datastore.connect();

            if (result instanceof Promise) {
                await result;
            }

            if (!datastore.isConnected()) {
                throw new FrostError("Datastore failed to run/update running status", ERROR_CODE.DATASTORE_FAILED_RUN);
            }

            datastore.getLogger().fine('Running.');
        } catch (e) {
            datastore.getLogger().fatal('Failed to run.');
            throw e;
        }
    }

    async registerManager(Manager, name, options, plugin) {
        this.getLogger().fine('Registering %s Manager.%s', name, plugin !== undefined ? `On behalf of Plugin: ${plugin.getName()}` : '');
        options = mergeDeep(plugin ? plugin.getOption(`manager=>${name}`, {}) : this.getOption(`manager=>${name}`, {}), options);

        const manager = new Manager(name, options, this, undefined, plugin);
        const func_name = `get${manager.getName()}Manager`;

        this.managers[manager.getName()] = manager;
        this[func_name] = this.getManager.bind(this, manager.getName());

        this.getLogger().info('Registered manager %s under function %s', manager.getName(), func_name);

        return this.runManager(manager.getName());
    }

    async runManager(manager_name) {
        const manager = this.getManager(manager_name);

        if (!manager) {
            throw new FrostError(`No such manager ${manager_name}`, ERROR_CODE.INVALID_MANAGER);
        }

        try {
            manager.getLogger().fine('Starting...');
            const result = manager.run();

            if (result instanceof Promise) {
                await result;
            }

            if (!manager.isRunning()) {
                throw new FrostError("Manager failed to run/update running status", ERROR_CODE.MANAGER_FAILED_RUN);
            }

            manager.getLogger().fine('Running.');
        } catch (e) {
            manager.getLogger().fatal('Failed to run.');
            throw e;
        }
    }

    getManagers() {
        return this.managers;
    }

    getManager(name) {
        return this.managers[name];
    }

    getDatastores() {
        return this.datastores;
    }

    getDatastore(name) {
        return this.datastores[name];
    }
}

module.exports = Frost;