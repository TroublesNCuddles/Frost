const {FrostManager, FrostError} = require('../structure/index.js');

//Improve Overall
class CacheManager extends FrostManager {
    constructor(...args) {
        super(...args);

        this.pools = {};
    }

    get(pool, key, def) {
        if (!this.getPool(pool)) {
            return def;
        }

        if (!this.getPool(pool)[key]) {
            return def;
        }

        const item = this.getPool(pool)[key];

        if (item.expire <= (new Date()).getMilliseconds()) {
            return def;
        }

        return item.value;
    }

    set(pool, key, value, lifespan = 5000) {
        if (!this.getPool(pool)) {
            this.registerPool(pool);
        }

        this.pools[pool][key] = {
            expire: lifespan + (new Date()).getMilliseconds(),
            value
        };
    }

    getPools() {
        return this.pools;
    }

    getPool(pool) {
        return this.pools[pool];
    }

    registerPool(pool) {
        //Throw error if pool exists
        this.pools[pool] = {};
    }
}

module.exports = CacheManager;