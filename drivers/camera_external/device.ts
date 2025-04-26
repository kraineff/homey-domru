import Homey from "homey";
import DomruApp from "../../app";
import { Writable } from "node:stream";

module.exports = class DomruCameraDevice extends Homey.Device {
    private image!: Homey.Image;

    async onInit() {
        const api = (this.homey.app as DomruApp).api;
        const id = this.getData().id;

        this.image = await this.homey.images.createImage();
        this.image.setStream(async (stream: Writable) => {
            const image = await api.getForpostCameraSnapshot(id);
            const buffer = Buffer.from(await image.arrayBuffer());
            stream.write(buffer);
            stream.end();
        });
        await this.image.update();
        await this.setCameraImage("snapshot", "Камера", this.image);
    }

    async onDeleted() {
        await this.image.unregister();
    }
}