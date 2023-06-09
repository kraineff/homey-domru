import Homey from 'homey';
import { DomruApi } from './lib';

export default class DomruApp extends Homey.App {
    api!: DomruApi;

    async onInit() {
        this.api = new DomruApi({
            get: async () => JSON.parse(this.homey.settings.get('storage') || '{}'),
            set: async content => this.homey.settings.set('storage', JSON.stringify(content))
        });
    }
}

module.exports = DomruApp;