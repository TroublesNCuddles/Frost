const {FrostManager, FrostError} = require('../structure/index.js');
const {ERROR_CODE} = require('../constant/index.js');
const {Client: DiscordClient} = require('discord.js');

class DiscordManager extends FrostManager {
    constructor(...args) {
        super(...args);

        this.discord_client = new DiscordClient(this.getOption('client', null));
    }

    async run() {
        await this.login();
        super.run();
    }

    login() {
        return new Promise((resolve, reject) => {
            if (!this.getOption('token', null)) {
                return reject(new FrostError('Missing Discord Token', ERROR_CODE.MISSING_DISCORD_TOKEN));
            }

            this.getDiscordClient().on('ready', () => {
                return resolve();
            });

            this.getDiscordClient().login(this.getOption('token')).catch(reject);
        });
    }

    getDiscordClient() {
        return this.discord_client;
    }
}

module.exports = DiscordManager;