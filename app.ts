import Homey from "homey";
import { DomruAPI } from "domru";

export default class DomruApp extends Homey.App {
    readonly api = new DomruAPI();

    async onInit() {
        const storage = this.homey.settings.get("storage");
        storage && await this.api.authWithStorage(JSON.parse(storage));

        this.api.events.on("storage_update", storage => {
            this.homey.settings.set("storage", JSON.stringify(storage));
        });
    }
}

module.exports = DomruApp;