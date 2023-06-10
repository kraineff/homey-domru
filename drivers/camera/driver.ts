import Homey from 'homey';
import DomruApp from '../../app';

module.exports = class DomruCameraDriver extends Homey.Driver {
    private _app!: DomruApp;

    async onInit() {
        this._app = this.homey.app as DomruApp;
    }

    async onPairListDevices() {
        const accounts = await this._app.accounts.getAccounts();
        const accountsObj = Object.values(accounts);

        const devices = await Promise.all(
            accountsObj.map(async account => {
                const cameras = await account.api.getForpostCameras();
                return cameras.map(camera => ({
                    name: camera.Name,
                    data: {
                        id: camera.ID,
                        account: account.id
                    }
                }));
            })
        );
        return devices.flat();
    }
}