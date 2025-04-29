import Homey from "homey";
import DomruApp from "../../app";
import { DomruAPI } from "domru";

module.exports = class DomruCameraDriver extends Homey.Driver {
    private api!: DomruAPI;

    async onInit() {
        this.api = (this.homey.app as DomruApp).api;
    }

    async onPair(session: Homey.Driver.PairSession) {
        const token = JSON.parse(this.homey.settings.get("storage") || "{}").token;

        session.setHandler("showView", async viewId => {
            if (viewId === "list_accounts" && !!token)
                await session.showView("list_devices");
        });
        session.setHandler("authGetContracts", async phone => {
            return await this.api.authGetContracts(phone);
        });
        session.setHandler("authGetCode", async ({ phone, contract }) => {
            await this.api.authGetCode(phone, contract);
            await new Promise(resolve => setTimeout(resolve, 3000));
        });
        session.setHandler("authWithCode", async ({ phone, contract, code }) => {
            await this.api.authWithCode(phone, contract, code);
        });
        session.setHandler("authWithPassword", async ({ login, password }) => {
            await this.api.authWithPassword(login, password);
        });
        session.setHandler("list_devices", async () => {
            const devices = await this.api.getForpostCameras();
            return devices.map(({ ID, Name }) => ({ name: Name, data: { id: ID } }));
        });
    }
}