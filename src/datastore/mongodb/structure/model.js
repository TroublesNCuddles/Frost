const {DatastoreModel} = require('../../../structure/index.js');
const {String: {capitalize}} = require('../../../util/index.js');
const {ObjectID} = require('mongodb');

class MongoDBModel extends DatastoreModel {
    constructor(name, result, datastore) {
        super(`MongoDB:${capitalize(name)}`, result, datastore);
    }

    _normalizeMetadata() {
        const {_metadata, _id} = this.getDocument();

        const {
            version,
            created,
            last_update,
            type,
            deleted
        } = _metadata;

        this.id = _id instanceof ObjectID ? _id : new ObjectID(_id);
        this.metadata = _metadata;
    }

    getDocument() {
        return this.getRawResult();
    }

    async save() {
        await super.save();
    }

    getID() {
        return this.id;
    }

    getMetadata() {
        return this.metadata;
    }

    setVersion(version) {
        if (version < this.getVersion()) {
            this.getLogger().warning({
                message: 'Refusing to set version to %d < than current %d',
                replacements: [version, this.getVersion()]
            });

            return;
        }

        this.metadata.version = version;
    }

    getVersion() {
        return this.getMetadata().version;
    }

    getCreationTime() {
        return this.getMetadata().created;
    }

    getLastUpdate() {
        return this.getMetadata().last_update;
    }

    setLastUpdate(last_update) {
        this.metadata.last_update = last_update;
    }

    isDeleted() {
        return this.getMetadata().deleted;
    }

    setDeleted(deleted) {
        this.metadata.deleted = deleted;
    }

    getType() {
        return this.getMetadata().type;
    }

    setType(type) {
        this.metadata.type = type;
    }
}

module.exports = MongoDBModel;