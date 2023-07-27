import Homey from 'homey';
import { DomruAPI } from './library';

export default class DomruApp extends Homey.App {
    api!: DomruAPI;

    async onInit() {
        this.api = new DomruAPI({
            get: async () => JSON.parse(this.homey.settings.get('storage') ?? '{}'),
            set: async token => this.homey.settings.set('storage', JSON.stringify(token))
        });
    }
}

module.exports = DomruApp;