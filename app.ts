import Homey from 'homey';
import { DomruApi, DomruTokens } from './lib';
import { Accounts } from './accounts';

export default class DomruApp extends Homey.App {
    accounts!: Accounts<DomruTokens, {
        api: DomruApi;
    }>;

    async onInit() {
        this.accounts = new Accounts({
            settings: this.homey.settings,
            initParams: async ({ get, set }) => ({
                api: new DomruApi({ get, set })
            })
        });
    }
}

module.exports = DomruApp;