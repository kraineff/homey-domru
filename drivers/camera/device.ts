import Homey from 'homey';
import DomruApp from '../../app';
import { DomruCamera } from '../../lib';

module.exports = class DomruCameraDevice extends Homey.Device {
    private _camera!: DomruCamera;
    private _image?: Homey.Image;

    async onInit() {
        const app = this.homey.app as DomruApp;
        const data = this.getData();
        const account = await app.accounts.getAccount(data.account);
        this._camera = new DomruCamera(account.api, data.id);

        this._image = await this.homey.images.createImage();        
        this._image.setStream(async (stream: any) => {
            const snapshot = await this._camera.getSnapshot()
                .catch(() => {});
            return snapshot.pipe(stream);
        });
        await this.setCameraImage('snapshot', 'Камера', this._image);
    }

    async onDeleted() {
        if (this._image)
            await this._image.unregister();
    }
}