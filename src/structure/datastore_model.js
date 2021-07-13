class DatastoreModel {
    constructor(name, result, datastore) {
        this._name = name;
        this.result = result;
        this.datastore = datastore;

        this.logger = this.getDatastore().getLogger().createChildLogger({
            components: ['Model', this._name]
        })

        this.normalize();
    }

    getDatastore() {
        return this.datastore;
    }

    normalize() {
        if (!this._determineVersion()) {
            throw new TypeError('No Version');
        }

        this._normalizeMetadata();

        const version = this.getVersion();
        const fn_name = `_normalizeV${version}`;

        if (typeof this[fn_name] === 'function') {
            this[fn_name]();
        }
    }

    _normalizeMetadata() {

    }

    async update() {
        while (this.needsUpdate()) {
            const update_fn_name = this.getNextUpdateCall();

            const result = this[update_fn_name]();

            if (result instanceof Promise) {
                await result;
            }
        }

        return this.save();
    }

    async save() {
        if (this.needsUpdate()) {
            await this.update();
        }

        if (this.getLastUpdate()) {
            this.setLastUpdate(new Date());
        }
    }

    async delete() {

    }

    needsUpdate() {
        return typeof this.getNextUpdateCall() === 'string';
    }

    getNextUpdateCall() {
        const version = this.getVersion();
        const next_up = version + 1;

        const fn_name = `_updateV${version}V${next_up}`;

        return typeof this[fn_name] === 'function' ? fn_name : null;
    }

    getID() {
        return null;
    }

    getRawResult() {
        return this.result;
    }

    getMetadata() {
        return null;
    }

    getVersion() {
        return -1;
    }

    setVersion(version) {

    }

    getCreationTime() {
        return null;
    }

    setCreationDate(creation_date) {
        this.getLogger().warning('Attempted to update creation date');
    }

    getLastUpdate() {
        return null
    }

    setLastUpdate(last_update) {

    }

    isDeleted() {
        return null
    }

    setDeleted(deleted) {

    }

    getType() {
        return null;
    }

    setType(type) {

    }

    _determineVersion() {
        return -1;
    }

    getLogger() {
        return this.logger;
    }
}

module.exports = DatastoreModel;