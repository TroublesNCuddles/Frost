const {FrostManager, FrostError, FrostPlugin} = require('../structure/index.js');
const {ERROR_CODE, PLUGIN_MANAGER: PLUGIN_MANAGER_CONSTANTS} = require('../constant/index.js');
const {Object: {mergeDeep}, fs} = require('../util/index.js');
const Path = require('path');

class PluginManager extends FrostManager {
    constructor(name, options, ...args) {
        super(name, mergeDeep(options), ...args);

        this.plugins = {};
    }

    async filterPluginPaths(paths) {
        const filtered_paths = [];

        for (const path of paths) {
            if (await this.verifyPluginPath(path)) {
                filtered_paths.push(path);
            }
        }

        return filtered_paths;
    }

    async verifyPluginPath(path) {
        try {
            await fs.readdir(path);

            return true;
        } catch (e) {
            this.getLogger().warning('Ignoring plugin path %s', path);
        }

        return false;
    }

    async findPlugins(paths) {
        const plugins = [];

        this.getLogger().fine('Looking for plugins in %s', paths.join(';'));

        for (const path of paths) {
            const found_plugins = await this.findPossiblePluginsInPath(path);
            this.getLogger().fine('Found %d plugin%s at %s', found_plugins.length, found_plugins.length === 1 ? '' : 's', path);
            plugins.push(...found_plugins);
        }

        return plugins;
    }

    async findPossiblePluginsInPath(path) {
        const plugins = [];
        const possible_directories = await fs.readdir(path);

        for (const possible_directory of possible_directories) {
            try {
                const stats = await fs.lstat(Path.join(path, possible_directory));

                if (!stats || !stats.isDirectory()) {
                    throw new FrostError('Not a directory.', ERROR_CODE.FIND_PLUGIN_NOT_A_DIR)
                }

                const plugin = require(Path.join(path, possible_directory, 'index.js'));

                if (!plugin || !plugin.Plugin || !plugin.Definition) {
                    throw new FrostError('Not a valid plugin.', ERROR_CODE.NOT_A_PLUGIN)
                }

                plugins.push(plugin);
            } catch (e) {
                this.getLogger().warning('Ignoring possible plugin at %s: %s', Path.join(path, possible_directory), e.message);
            }
        }

        return plugins;
    }

    normalizePluginDefinitions(plugins) {
        return plugins.map(({Plugin, Definition}) => {
            const {
                name,
                default_options,
                dependencies,
                priority,
                parent,
                optional
            } = Definition;

            return {
                Plugin,
                Definition: {
                    name,
                    default_options,
                    dependencies: ['datastores', 'plugins', 'managers'].reduce((accumulator, key) => {
                        const raw_dependency = dependencies[key] || [];

                        accumulator[key] = (Array.isArray(raw_dependency) ? raw_dependency : [raw_dependency]).filter(el => typeof el === 'string');

                        return accumulator;
                    }, {}),
                    priority: !Array.isArray(priority) ? [Number(priority), Number(priority)] : priority,
                    parent,
                    optional: optional === undefined ? false : optional
                }
            };
        });
    }

    sortPlugins(plugins, index = 0) {
        return plugins.sort(({Definition: {priority: a}}, {Definition: {priority: b}}) => {
            if (a[index] < b[index]) {
                return -1;
            } else if (a[index] === b[index]) {
                return 0;
            }

            return 1;
        });
    }

    checkDependencies(dependencies, running = false) {
        const {
            managers: manager_dependencies,
            plugins: plugin_dependencies
        } = dependencies;

        const missing_manager_dependencies = manager_dependencies.filter(manager => this.getFrost().getManager(manager) === undefined || (running && !this.getFrost().getManager(manager).isRunning()));
        const missing_plugin_dependencies = plugin_dependencies.filter(plugin => this.getPlugin(plugin) === undefined || (running && !this.getPlugin(plugin).isRunning()));

        if (missing_manager_dependencies.length > 0 || missing_plugin_dependencies > 0) {
            return {
                managers: missing_manager_dependencies,
                plugins: missing_plugin_dependencies
            }
        }

        return true;
    }

    loadPlugins(plugins) {
        plugins.forEach(plugin => {
            try {
                this.loadPlugin(plugin)
            } catch (error) {
                if (!plugin.Definition.optional) {
                    throw error;
                }

                this.getLogger().error('Failed to load plugin %s', plugin.Definition.name);
                this.getLogger().error(error);
            }
        });
    }

    loadPlugin({Plugin, Definition}) {
        let {
            name,
            parent: parent_name,
            dependencies,
            optional,
            priority
        } = Definition;
        const default_options = Definition.default_options;
        const options = mergeDeep(default_options, this.getFrost().getOption(`plugin=>${name}`, {}));
        let logger = this.getFrost().getLogger().createChildLogger(mergeDeep(options.logger || {}, {
            components: ['Plugin', name]
        }));

        let ParentPlugin;

        if (parent_name) {
            if (!this.getPlugin(parent)) {
                throw new FrostError('Missing Parent', ERROR_CODE.PLUGIN_MISSING_PARENT, {
                    plugin: name,
                    parent
                });
            }

            ParentPlugin = this.getPlugin(parent);
            logger = ParentPlugin.getLogger().createChildLogger(mergeDeep(options.logger || {}, {
                components: ['Child', name]
            }));
            dependencies.plugins = [parent_name, ...dependencies.plugins];
        }

        Definition = {
            dependencies,
            parent: parent_name,
            name,
            optional,
            default_options,
            priority
        };

        const dependency_check = this.checkDependencies(dependencies, false);

        if (dependency_check !== true) {
            //TODO: Add info about which dependencies are missing.
            this.getLogger().warning('Failed to load plugin "%s" due to missing dependencies [Managers: %s, Plugins: %s]', name, dependency_check.managers.join(';') || 'No Missing Managers', dependency_check.plugins.join(';') || 'No Missing Plugins');
            throw new FrostError('Missing Dependencies', ERROR_CODE.PLUGIN_MISSING_DEPENDENCIES, {
                dependencies: dependency_check,
                plugin: name
            });
        }

        Plugin = new Plugin(Definition, options, this.getFrost(), logger);

        if (ParentPlugin) {
            Plugin.setParent(ParentPlugin);
        }

        this.plugins[name] = Plugin;
        Plugin.getLogger().fine('Loaded');
    }

    async runPlugins(plugins) {
        for (const plugin of plugins) {
            try {
                await this.runPlugin(plugin)
            } catch (error) {
                if (!plugin.getDefinition().optional) {
                    throw error;
                }

                this.getLogger().error('Failed to run plugin %s', plugin.getDefinition().name);
                this.getLogger().error(error);
            }
        }
    }

    async runPlugin(plugin) {
        plugin.getLogger().fine('Starting...');

        const dependency_check = this.checkDependencies(plugin.getDefinition().dependencies, true);

        if (dependency_check !== true) {
            const name = plugin.getDefinition().name;
            //TODO: Add info about which dependencies are missing.
            this.getLogger().warning('Failed to load plugin "%s" due to missing dependencies [Managers: %s, Plugins: %s]', name, dependency_check.managers.join(';') || 'No Missing Managers', dependency_check.plugins.join(';') || 'No Missing Plugins');
            throw new FrostError('Missing Dependencies', ERROR_CODE.PLUGIN_MISSING_DEPENDENCIES, {
                dependencies: dependency_check,
                plugin: name
            });
        }

        const result = plugin.run();

        if (result instanceof Promise) {
            await result;
        }

        if (!plugin.isRunning()) {
            throw new FrostError("Plugin failed to run/update running status", ERROR_CODE.PLUGIN_FAILED_RUN, {plugin: plugin.getDefinition().name});
        }

        plugin.getLogger().fine('Running.');
    }

    async run() {
        const plugin_directories = await this.filterPluginPaths(this.getPluginPaths());
        const found_plugins = await this.findPlugins(plugin_directories);
        const normalized_plugins = this.normalizePluginDefinitions(found_plugins);
        const plugins_sorted_for_loading = this.sortPlugins(normalized_plugins, 0);

        this.loadPlugins(plugins_sorted_for_loading);

        const plugins_for_running = Object.values(this.getPlugins()).map(plugin => ({
            Plugin: plugin,
            Definition: plugin.getDefinition()
        }));
        const plugins_sorted_for_running = this.sortPlugins(plugins_for_running, 1).map(({Plugin}) => Plugin);

        await this.runPlugins(plugins_sorted_for_running);

        const running_plugins_count = Object.values(this.getPlugins()).filter(plugin => plugin.isRunning()).length;

        this.getLogger().info('Running %d plugin%s', running_plugins_count, running_plugins_count === 1 ? '' : 's');
        super.run();
    }

    getPluginPaths() {
        let option_paths = this.getOption('paths', '');

        if (typeof option_paths === 'string') {
            option_paths = option_paths.split(';');
        }

        if (!Array.isArray(option_paths)) {
            this.getLogger().warning('Bad paths provided in options');
            option_paths = [];
        }

        return [...PLUGIN_MANAGER_CONSTANTS.DEFAULT_PLUGIN_PATHS, ...option_paths].filter(el => !!el);
    }

    getPlugins() {
        return this.plugins;
    }

    getPlugin(name) {
        return this.getPlugins()[name];
    }
}

module.exports = PluginManager;