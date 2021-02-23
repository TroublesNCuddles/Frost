const {init} = require('./init.js');
const {Logger} = require('../structure/index.js');
const {
    Transports: {
        Console: ConsoleLogTransport
    }
} = require('../log/index.js');

let logger = new Logger({
    components: [],
    transports: [new ConsoleLogTransport()]
});
let runner_logger = logger.createChildLogger({components: ['Bootstrap', 'Runner']});

runner_logger.info('Starting....');

init(logger, {pass_on_logger: true})
    .then(frost => frost.run())
    .then(() => {
        runner_logger.info('Done')
    })
    .catch(error => {
        runner_logger.fatal('BOOTSTRAPPING ERROR');
        runner_logger.fatal(error);
        process.exit(1);
    });