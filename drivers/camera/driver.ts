import Homey from 'homey';
import DomruApp from '../../app';
import { DomruAPI } from '../../library';

module.exports = class DomruCameraDriver extends Homey.Driver {
    #api!: DomruAPI;

    async onInit() {
        const app = this.homey.app as DomruApp;
        this.#api = app.api;
    }

    async onPairListDevices() {
        const forpostCameras = await this.#api.getForpostCameras();
        return forpostCameras.map(forpostCamera => ({
            name: forpostCamera.Name,
            data: {
                id: forpostCamera.ID
            }
        }));
    }
}