import Homey from "homey";
import DomruApp from "../../app";
import { DomruAPI } from "domru";

module.exports = class DomruAccessControlDriver extends Homey.Driver {
    private api!: DomruAPI;

    async onInit() {
        this.api = (this.homey.app as DomruApp).api;
    }

    async onPairListDevices() {
        const places = await this.api.getSubscriberPlaces();
        const placeIds = places.map(place => place.place.id);
        const promises = placeIds.map(async placeId => {
            const devices = await this.api.getAccessControls(placeId);
            return devices.map(({ id, name }) => ({ name, data: { id, placeId } }));
        });

        return await Promise.all(promises).then(devices => devices.flat());
    }
}