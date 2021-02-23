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

class Frost extends BaseLoggableClass {
    constructor(options, logger) {
        super(options, null, logger);

        this.managers = {};
        this.registerDefaultManagers();
    }

    async run() {
        this.getLogger().info('Starting...');
        await this.runManagers();
        this.getLogger().info('Running.');
    }

    async runManagers() {
        this.getLogger().fine('Starting Managers...');

        for (const manager of Object.values(this.getManagers())) {
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

        this.getLogger().fine('All managers running.');
    }

    registerDefaultManagers() {
        this.getLogger().fine('Registering default managers');
        for (const [key, Manager] of Object.entries(Managers)) {
            this.registerManager(Manager, key.slice(0, -("Manager".length)), {});
        }
    }

    registerManager(Manager, name, options) {
        this.getLogger().fine('Registering %s Manager', name);
        name = name.toLowerCase();
        options = mergeDeep(this.getOption(`${name}_manager`, {}), options);

        const manager = new Manager(name, options, this);
        const func_name = `get${manager.getName()}Manager`;

        this.managers[manager.getName()] = manager;
        this[func_name] = this.getManager.bind(this, manager.getName());

        this.getLogger().fine('Registered manager %s under function %s', manager.getName(), func_name);
    }

    getManagers() {
        return this.managers;
    }

    getManager(name) {
        return this.managers[name];
    }
}

module.exports = Frost;