/**
 *
 * REQUIREMENTS
 *
 */
const {Object: {mergeDeep}, fs} = require('../util/index.js');
const Package = require('../../package.json');
const os = require('os');
const path = require('path');

/**
 *
 * CONSTANTS
 *
 */

const DEFAULT_FILE_PATHS = [path.join(process.cwd(), 'lib', 'configs'), path.join(os.homedir(), Package._name, 'configs'), path.join(os.homedir(), Package._name, 'lib', 'configs')];

const parse = buffer => {
    return JSON.parse(buffer.toString('utf8'));
};

const parseFiles = files => {
    return files.map(file => parse(file));
}

const loadFile = async (file) => {
    return fs.readFile(file);
}

const loadFiles = async (files) => {
    for (let index = 0; index < files.length; index++) {
        files[index] = await loadFile(files[index])
    }

    return files;
}

const getFiles = async (directory) => {
    const files = [];
    const directory_contents = await fs.readdir(directory);
    const errors = [];

    for (const file of directory_contents) {
        try {
            const file_stats = await fs.lstat(path.join(directory, file));

            if (file_stats.isDirectory()) {
                files.push(...(await getFiles(path.join(directory, file))));

                continue;
            }

            if (file.endsWith('.json')) {
                files.push(path.join(directory, file));
            }
        } catch (error) {
            errors.push([file, error, 'getFiles']);
        }
    }

    return {files, errors};
};

const build = async (paths) => {
    let files = [];
    let errors = [];

    if (!fs) {
        throw new Error('FlatFile failed, FS Unavailable. Is your Node.js version too old?');
    }

    for (const path of paths) {
        try {
            const result = await getFiles(path)
            files.push(...result.files);
            errors.push(...result.errors);
        } catch (error) {
            errors.push([path, error, 'build'])
        }
    }

    try {
        files = await loadFiles(files);
        files = parseFiles(files);
    } catch (error) {
        return {failing_error: error, errors};
    }

    if (paths.length === errors.filter(([content, error, type]) => type === 'build').length) {
        return {failing_error: `Failed to load files from any of the specified paths.`, errors};
    }

    return {files: mergeDeep(...files), errors};
}

module.exports = {
    parse,
    parseFiles,
    loadFile,
    loadFiles,
    getFiles,
    build,
    CONSTANT: {
        DEFAULT_FILE_PATHS
    }
};