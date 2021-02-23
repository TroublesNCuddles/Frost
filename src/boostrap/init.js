/*
 *
 *  REQUIREMENTS
 *
 */
const {build: buildEnvironmentalConfig} = require('./environment.js');
const {
    build: buildFlatFileConfig,
    CONSTANT: {
        DEFAULT_FILE_PATHS
    }
} = require('./flatfile.js');
const {
    LOG_LEVEL, DEFAULT: {
        BOOTSTRAP: {
            LOAD_CONFIGURATION: DEFAULT_LOAD_CONFIG_OPTIONS
        },
        FROST: DEFAULT_FROST_OPTIONS
    }
} = require('../constant/index.js')
const {Logger} = require('../structure/index.js');
const {
    Transports: {
        Console: ConsoleLogTransport
    }
} = require('../log/index.js');
const {
    Object: {
        mergeDeep, fetchValueFromObject, isObject
    }
} = require('../util/index.js');
const Package = require('../../package.json');
const Frost = require('../frost.js');

/*
 *
 * Functions
 *
 */

const countKeys = (obj) => {
    let count = 0;

    for (const [key, value] of Object.entries(obj)) {
        count++;

        if (isObject(value) && !Array.isArray(value)) {
            count += countKeys(value);
        }
    }

    return count;
}

const loadConfiguration = async (logger, options = {}) => {
    options = mergeDeep(DEFAULT_LOAD_CONFIG_OPTIONS, options);
    logger.info('Loading configurations');
    logger.fine('Got %d key(s) from Default Options', countKeys(DEFAULT_FROST_OPTIONS));
    logger.info('Building configuration from environment variables');

    const environment_options = buildEnvironmentalConfig(
        process.env,
        options.env.prefixes,
        options.env.separator,
    );

    logger.fine('Got %d key(s) from Environmental Options', countKeys(environment_options));
    logger.info('Building configuration from flat files');

    const flatfile_paths = fetchValueFromObject("bootstrap=>flatfile_paths", '', mergeDeep(environment_options, options)).split(';').filter(el => !!el);

    flatfile_paths.unshift(...DEFAULT_FILE_PATHS);
    logger.fine("Loading FlatFile configurations from %s", flatfile_paths.join(';'));

    let {files: file_options, failing_error, errors} = await buildFlatFileConfig(flatfile_paths);

    if (errors && Array.isArray(errors) && options.flatfile.silence_individual_errors.toString() !== 'true') {
        errors = errors.filter(([content, error, type]) => {
            return !(type === 'build' && DEFAULT_FILE_PATHS.includes(content) && options.flatfile.silence_default_path_errors.toString() === 'true');
        })

        if (errors.length > 0) {
            logger.warning('Errors occoured while loading flatfiles');
            errors.forEach(([content, error, type], index) => logger.error('[%d], %s:%s; ', index + 1, type, content, error.message));
        }
    }

    let configuration = mergeDeep(DEFAULT_FROST_OPTIONS, environment_options);

    if (!failing_error) {
        logger.fine('Got %d key(s) from FlatFile Options', countKeys(file_options));

        configuration = mergeDeep(DEFAULT_FROST_OPTIONS, file_options, environment_options);
    }

    if (failing_error) {
        logger.warning('Failed to build FlatFile options');

        if (typeof failing_error === Error) {
            logger.error(failing_error);
        } else {
            logger.warning(failing_error);
        }
    }

    logger.fine('Got %d key(s) overall', countKeys(configuration));

    return configuration;
}

const init = async (logger, options = {}) => {
    const components = ['Boostrap', 'Init'];

    let bootstrap_logger = new Logger({
        components,
        transports: [new ConsoleLogTransport()],
        level: LOG_LEVEL.DEBUG
    });

    if (logger) {
        bootstrap_logger = logger.createChildLogger({
            components
        });
    }

    const configuration = await loadConfiguration(bootstrap_logger, options.load_configuration);
    bootstrap_logger.info('Initializing %s v%s by %s', Package._name, Package.version, Package.author);

    return new Frost(configuration, options.pass_on_logger ? logger : undefined);
}

/*
 *
 * EXPORTS
 *
 */

module.exports = {
    countKeys,
    loadConfiguration,
    init
};