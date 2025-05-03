import Homey from "homey";
import DomruApp from "../../app";
import { DomruAPI } from "domru";

export class DomruAccessControlDriver extends Homey.Driver {
    private api!: DomruAPI;
    private inviteReceivedTrigger!: Homey.FlowCardTriggerDevice;

    async onInit() {
        this.api = (this.homey.app as DomruApp).api;
        this.inviteReceivedTrigger = this.homey.flow.getDeviceTriggerCard("invite_received");
    }

    triggerInviteReceived(device: Homey.Device) {
        this.inviteReceivedTrigger.trigger(device);
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
            const places = await this.api.getSubscriberPlaces();
            const placeIds = places.map(place => place.place.id);
            const promises = placeIds.map(async placeId => {
                const devices = await this.api.getAccessControls(placeId);
                return devices.map(async ({ id, name }) => ({ name, data: { id, placeId } }));
            });
            return await Promise.all(promises).then(devices => devices.flat());
        });
    }
}

module.exports = DomruAccessControlDriver;