import Homey from "homey";
import DomruApp from "../../app";
import { DomruAPI } from "domru";
import { Writable } from "node:stream";

module.exports = class DomruAccessControlDevice extends Homey.Device {
    private api!: DomruAPI;
    private id!: number;
    private placeId!: number;
    private image?: Homey.Image;
    private openDuration!: number;

    async onInit() {
        this.api = (this.homey.app as DomruApp).api;
        this.id = this.getData().id;
        this.placeId = this.getData().placeId;
        this.openDuration = this.getSetting("open_duration");
        
        const accessControls = await this.api.getAccessControls(this.placeId);
        const accessControl = accessControls.find(ac => ac.id === this.id);
        if (!accessControl) throw new Error("Неверное устройство доступа");

        if (!Number.isNaN(accessControl.externalCameraId)) {
            const cameraId = Number(accessControl.externalCameraId);
            this.image = await this.homey.images.createImage();
            this.image.setStream(async (stream: Writable) => {
                const image = await this.api.getForpostCameraSnapshot(cameraId);
                const buffer = Buffer.from(await image.arrayBuffer());
                stream.write(buffer);
                stream.end();
            });
            await this.image.update();
            await this.setCameraImage("snapshot", "Камера", this.image);
        }

        await this.setCapabilityValue("locked", true);
        this.registerCapabilityListener("locked", async value => {
            if (value) return;
            await this.api.setAccessControlAction(this.placeId, this.id, "accessControlOpen");
            setTimeout(async () => this.setCapabilityValue("locked", true), this.openDuration * 1000);
        });
    }

    async onDeleted() {
        if (this.image) await this.image.unregister();
    }

    // @ts-ignore
    async onSettings({ newSettings, changedKeys }) {
        if (changedKeys.includes("open_duration"))
            this.openDuration = newSettings.open_duration;
    }
}