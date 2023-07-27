import Homey from 'homey';
import DomruApp from '../../app';
import { DomruAccessControl } from '../../library';

module.exports = class DomruAccessControlDevice extends Homey.Device {
    #accessControl!: DomruAccessControl;
    #image?: Homey.Image;
    #openDuration!: number;
    #cameraRefreshTimer!: NodeJS.Timer;

    async onInit() {
        const api = (this.homey.app as DomruApp).api;
        const data = this.getData();
        const acId = data.id;
        const placeId = data.placeId;

        this.#accessControl = new DomruAccessControl(api, placeId, acId);
        this.#openDuration = this.getSetting('open_duration');
        
        await this.#accessControl.getCamera()
            .then(async camera => {
                this.#image = await this.homey.images.createImage();
                this.#image.setStream(async (source: any) => {
                    const snapshot = await camera.getSnapshot().catch(() => {});
                    return snapshot.pipe(source);
                });
                
                await this.setCameraImage('snapshot', 'Камера', this.#image);
                this.#setCameraRefreshInterval(this.getSetting('camera_interval'));
            })
            .catch(() => {});

        this.#registerCapabilities();
        await this.setCapabilityValue('locked', true);
    }

    async onDeleted() {
        if (this.#image) await this.#image.unregister();
    }

    #setCameraRefreshInterval(seconds: number) {
        clearInterval(this.#cameraRefreshTimer);
        if (!this.#image || seconds <= 0) return;
        
        this.#cameraRefreshTimer = setInterval(async () => {
            await this.#image!.update();
        }, seconds * 1000);
    }

    #registerCapabilities() {
        this.registerCapabilityListener('locked', async value => {
            if (value) return;
            await this.#accessControl.setOpen();
            
            setTimeout(async () => {
                await this.setCapabilityValue('locked', true);
            }, this.#openDuration * 1000);
        });
    }

    // @ts-ignore
    async onSettings({ newSettings, changedKeys }) {
        if (changedKeys.includes('open_duration'))
            this.#openDuration = newSettings.open_duration;
        if (changedKeys.includes('camera_interval'))
            this.#setCameraRefreshInterval(newSettings.camera_interval);
    }
}