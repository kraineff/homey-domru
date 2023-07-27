import Homey from 'homey';
import DomruApp from '../../app';
import { DomruCamera } from '../../library';

module.exports = class DomruCameraDevice extends Homey.Device {
    #image!: Homey.Image;
    #cameraRefreshTimer!: NodeJS.Timer;

    async onInit() {
        const app = this.homey.app as DomruApp;
        const api = app.api;
        const camera = new DomruCamera(api, this.getData().id);

        this.#image = await this.homey.images.createImage();
        this.#image.setStream(async (source: any) => {
            const snapshot = await camera.getSnapshot()
                .catch(() => this.setUnavailable('Камера недоступна'));
            return snapshot.pipe(source);
        });

        await this.setCameraImage('snapshot', 'Камера', this.#image);
        this.#setCameraRefreshInterval(this.getSetting('camera_interval'));
    }

    async onDeleted() {
        await this.#image.unregister();
    }

    #setCameraRefreshInterval(seconds: number) {
        clearInterval(this.#cameraRefreshTimer);
        if (seconds <= 0) return;
        
        this.#cameraRefreshTimer = setInterval(async () => {
            await this.#image.update();
        }, seconds * 1000);
    }

    // @ts-ignore
    async onSettings({ newSettings, changedKeys }) {
        if (changedKeys.includes('camera_interval'))
            this.#setCameraRefreshInterval(newSettings.camera_interval);
    }
}