import Homey from 'homey';
import DomruApp from '../../app';
import { DomruAPI } from '../../library';

module.exports = class DomruAccessControlDriver extends Homey.Driver {
    #api!: DomruAPI;

    async onInit() {
        const app = this.homey.app as DomruApp;
        this.#api = app.api;
    }

    async onPairListDevices() {
        const placeIds = await this.#api
            .getSubscriberPlaces()
            .then(subscriberPlaces =>
                subscriberPlaces.map(subscriberPlace => subscriberPlace.place.id));
        
        return await Promise.all(
            placeIds.map(async placeId => {
                const accessControls = await this.#api.getAccessControls(placeId);
                return accessControls.map(accessControl => ({
                    name: accessControl.name,
                    data: {
                        id: accessControl.id,
                        placeId
                    }
                }));
            })
        ).then(acs => acs.flat());
    }
}