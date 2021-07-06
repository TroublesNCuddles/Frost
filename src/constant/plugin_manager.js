const path = require('path');
const os = require('os');
const Package = require('../../package.json');

const DEFAULT_PLUGIN_PATHS = [path.join(__dirname, '..', 'plugins'), path.join(process.cwd(), 'plugins'),  path.join(os.homedir(), Package._name, 'plugins')];

module.exports = {
    DEFAULT_PLUGIN_PATHS
};