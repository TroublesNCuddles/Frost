/*
 *
 *  REQUIREMENTS
 *
 */
class FrostError extends Error {
    constructor(message, code, data) {
        super(`[${code}]: ${message}`);

        this.code = code;
        this.data = data;
        this.time = new Date();
    }

    getCode() {
        return this.code;
    }

    getData() {
        return this.data;
    }

    getTime() {
        return this.time;
    }

    serialize() {
        return {
            message: this.message,
            code: this.getCode(),
            name: this.name,
            data: this.getData(),
            timestamp: this.getTime().toISOString()
        };
    }
}

module.exports = FrostError;