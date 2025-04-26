import Homey from "homey";
import DomruApp from "../../app";
import { DomruAPI } from "domru";

module.exports = class DomruCameraDriver extends Homey.Driver {
    private api!: DomruAPI;

    async onInit() {
        this.api = (this.homey.app as DomruApp).api;
    }

    async onPairListDevices() {
        const devices = await this.api.getForpostCameras();
        return devices.map(({ ID, Name }) => ({ name: Name, data: { id: ID } }));
    }
}