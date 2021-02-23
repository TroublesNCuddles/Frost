const {init} = require('./init.js');

let logger;

init()
    .then(([frost, bootstrap_logger]) => {
        logger = bootstrap_logger;

        return frost.run();
    })
    .then(() => {
        if (logger) {
            logger.info('Done');
        }
    })
    .catch(error => {
        if (logger) {
            logger.fatal(error);
            process.exit(1);

            return;
        }

        console.error('FATAL BOOTSTRAPPING ERROR');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    });