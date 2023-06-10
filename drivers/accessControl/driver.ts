import Homey from 'homey';
import DomruApp from '../../app';

module.exports = class DomruAccessControlDriver extends Homey.Driver {
    private _app!: DomruApp;

    async onInit() {
        this._app = this.homey.app as DomruApp;
    }

    async onPairListDevices() {
        const accounts = await this._app.accounts.getAccounts();
        const accountsObj = Object.values(accounts);

        const devices = await Promise.all(
            accountsObj.map(async account => {
                const subscriberPlaces = await account.api.getSubscriberPlaces();
                const accessControls = subscriberPlaces
                    .map(({ place }) => place)
                    .map(({ accessControls }) => accessControls)
                    .flat();

                return accessControls.map(accessControl => ({
                    name: accessControl.name,
                    data: {
                        id: accessControl.id,
                        account: account.id
                    }
                }));
            })
        );
        return devices.flat();
    }
}