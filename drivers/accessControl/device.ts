import Homey from 'homey';
import DomruApp from '../../app';
import { DomruAccessControl } from '../../lib';

module.exports = class DomruAccessControlDevice extends Homey.Device {
    private _accessControl!: DomruAccessControl;
    private _image?: Homey.Image;

    async onInit() {
        const app = this.homey.app as DomruApp;
        const data = this.getData();
        const account = await app.accounts.getAccount(data.account);
        this._accessControl = new DomruAccessControl(account.api, data.id);

        if (this.getCapabilityValue('locked') === null)
            await this.setCapabilityValue('locked', true);

        const camera = await this._accessControl.getCamera();
        if (camera) {
            this._image = await this.homey.images.createImage();        
            this._image.setStream(async (stream: any) => {
                const snapshot = await camera.getSnapshot()
                    .catch(() => {});
                return snapshot.pipe(stream);
            });
            await this.setCameraImage('snapshot', 'Камера', this._image);
        }

        this._registerCapabilities();
    }

    async onDeleted() {
        if (this._image)
            await this._image.unregister();
    }

    private _registerCapabilities() {
        this.registerCapabilityListener('locked', async value => {
            if (value) return;
            await this._accessControl.open();
            
            setTimeout(async () => {
                await this.setCapabilityValue('locked', true);
            }, 5000);
        });
    }
}