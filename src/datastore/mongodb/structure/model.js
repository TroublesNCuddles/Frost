const {DatastoreModel} = require('../../../structure/index.js');
const {String: {capitalize}} = require('../../../util/index.js');
const {ObjectID} = require('mongodb');

class MongoDBModel extends DatastoreModel {
    constructor(name, datastore, result) {
        super(`MongoDB:${capitalize(name)}`, datastore, result);

        this._save_query = undefined;
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

    static create(version = 1, type) {
        return {
            _metadata: {
                version,
                created: new Date(),
                last_update: new Date(),
                type,
                deleted: false
            }
        }
    }

    getDocument() {
        return this.getRawResult();
    }

    async save() {
        if (this._save_query) {
            await super.save();
        }

        const result = await this.getCollection().updateOne({_id: this.getID()}, this._save_query);

        if (result.modifiedCount > 0) {
            this._save_query = undefined;
            return true;
        }

        return false;
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
        this._set("_metadata.last_update", last_update);
    }

    isDeleted() {
        return this.getMetadata().deleted;
    }

    setDeleted(deleted) {
        this.metadata.deleted = deleted;
        this._set("_metadata.deleted", deleted);
    }

    getType() {
        return this.getMetadata().type;
    }

    setType(type) {
        this.metadata.type = type;
    }

    _set(key, value) {
        if (!this._save_query) {
            this._save_query = {};
        }

        if (!this._save_query['$set']) {
            this._save_query['$set'] = {}
        }

        this._save_query['$set'][key] = value;
    }
}

module.exports = MongoDBModel;