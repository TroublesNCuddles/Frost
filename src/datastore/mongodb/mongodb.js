const {Datastore} = require('../../structure/index.js');
const {MongoClient} = require('mongodb');
const {URL} = require('url');
const {DEFAULT_OPTIONS} = require('./constant/index.js');

class DatastoreMongoDB extends Datastore {

    async connect() {
        if (!this.getURL()) {
            throw new TypeError('Invalid MongoDB URL');
        }

        const parsed_url = new URL(this.getURL());
        this.getLogger().fine({
            message: 'Connecting %s:%d%s',
            replacements: [parsed_url.hostname, parsed_url.port, parsed_url.path ? parsed_url.path : parsed_url.pathname]
        });
        const driver_options = this.getOption('driver', DEFAULT_OPTIONS);

        this.client = await MongoClient.connect(this.getURL(), driver_options);
        this.database = this.getClient().db();
        this.connected = true;
        this.getLogger().info('Connected');
    }

    getURL() {
        return this.getOption('url', null);
    }

    getClient() {
        return this.client;
    }

    getDatabase() {
        return this.database;
    }

    getCollection(collection) {
        if (!this.getDatabase()) {
            throw new Error('Not Connected');
        }

        return this.getDatabase().collection(collection);
    }
}

module.exports = DatastoreMongoDB;